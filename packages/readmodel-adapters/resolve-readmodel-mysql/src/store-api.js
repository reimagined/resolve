const STRING_INDEX_TYPE =
  'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
const NUMBER_INDEX_TYPE = 'BIGINT'
const MAX_LIMIT_VALUE = 0x0fffffff | 0

const getTypeDefinitionForColumn = columnType => {
  switch (columnType) {
    case 'primary-string':
      return `${STRING_INDEX_TYPE} NOT NULL`
    case 'primary-number':
      return `${NUMBER_INDEX_TYPE} NOT NULL`
    case 'secondary-string':
      return `${STRING_INDEX_TYPE} NULL`
    case 'secondary-number':
      return `${NUMBER_INDEX_TYPE} NULL`
    default:
      return 'JSON'
  }
}

const defineTable = async (
  { connection, escapeId },
  tableName,
  tableDescription
) => {
  await connection.execute(
    `CREATE TABLE ${escapeId(tableName)} (\n` +
      [
        Object.keys(tableDescription)
          .map(
            columnName =>
              `${escapeId(columnName)} ${getTypeDefinitionForColumn(
                tableDescription[columnName]
              )}`
          )
          .join(',\n'),
        Object.keys(tableDescription)
          .filter(columnName => tableDescription[columnName] !== 'regular')
          .map(
            (columnName, idx) =>
              idx === 0
                ? `PRIMARY KEY (${escapeId(columnName)})`
                : `INDEX USING BTREE (${escapeId(columnName)})`
          )
          .join(',\n')
      ].join(',\n') +
      `\n)`
  )
}

const makeNestedPath = nestedPath =>
  `$.${nestedPath.map(JSON.stringify).join('.')}`

const makeCompareOperator = oper => {
  switch (oper) {
    case '$eq':
      return '='
    case '$ne':
      return '<>'
    case '$lte':
      return '<='
    case '$gte':
      return '>='
    case '$lt':
      return '<'
    case '$gt':
      return '>'
    default:
      return '='
  }
}

const searchToWhereExpression = (expression, fieldTypes, escapeId) => {
  const searchExprArray = []
  const searchValues = []

  const isDocumentExpr =
    Object.keys(expression).filter(key => key.indexOf('$') > -1).length === 0

  if (isDocumentExpr) {
    for (let fieldName of Object.keys(expression)) {
      const [baseName, ...nestedPath] = fieldName.split('.')
      const resultFieldName =
        nestedPath.length > 0
          ? `${escapeId(baseName)}->'${makeNestedPath(nestedPath)}'`
          : escapeId(baseName)

      let fieldValue = expression[fieldName]
      let fieldOperator = '='

      if (fieldValue instanceof Object) {
        fieldOperator = Object.keys(fieldValue)[0]
        fieldValue = fieldValue[fieldOperator]
      }

      const resultOperator = makeCompareOperator(fieldOperator)

      if (fieldTypes[baseName] === 'regular') {
        searchExprArray.push(
          `${resultFieldName} ${resultOperator} CAST(? AS JSON)`
        )
        searchValues.push(JSON.stringify(fieldValue))
      } else {
        searchExprArray.push(`${resultFieldName} ${resultOperator} ?`)
        searchValues.push(fieldValue)
      }
    }

    return {
      searchExpr: searchExprArray.join(' AND '),
      searchValues
    }
  }

  for (let operatorName of Object.keys(expression)) {
    if (operatorName === '$and' || operatorName === '$or') {
      const localSearchExprArray = []
      for (let innerExpr of expression[operatorName]) {
        const whereExpr = searchToWhereExpression(
          innerExpr,
          fieldTypes,
          escapeId
        )
        localSearchExprArray.push(whereExpr.searchExpr)
        whereExpr.searchValues.map(val => searchValues.push(val))
      }

      const joiner = operatorName === '$and' ? ' AND ' : ' OR '
      if (localSearchExprArray.length > 1) {
        searchExprArray.push(
          localSearchExprArray.map(val => `(${val})`).join(joiner)
        )
      } else {
        searchExprArray.push(localSearchExprArray[0])
      }
      break
    }

    if (operatorName === '$not') {
      const whereExpr = searchToWhereExpression(
        expression[operatorName],
        fieldTypes,
        escapeId
      )

      whereExpr.searchValues.map(val => searchValues.push(val))
      searchExprArray.push(`NOT (${whereExpr.searchExpr})`)

      break
    }
  }

  return {
    searchExpr: searchExprArray.join(' AND '),
    searchValues
  }
}

const updateToSetExpression = (expression, fieldTypes, escapeId) => {
  const updateExprArray = []
  const updateValues = []

  for (let operatorName of Object.keys(expression)) {
    for (let fieldName of Object.keys(expression[operatorName])) {
      const fieldValue = expression[operatorName][fieldName]
      const [baseName, ...nestedPath] = fieldName.split('.')

      switch (operatorName) {
        case '$unset': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = JSON_REMOVE(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}') `
            )
          } else {
            updateExprArray.push(`${escapeId(baseName)} = NULL `)
          }
          break
        }

        case '$set': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = JSON_SET(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}', CAST(? AS JSON)) `
            )
          } else {
            updateExprArray.push(`${escapeId(baseName)} = ? `)
          }

          if (fieldTypes[baseName] === 'regular') {
            updateValues.push(JSON.stringify(fieldValue))
          } else {
            updateValues.push(fieldValue)
          }

          break
        }

        case '$inc': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = JSON_SET(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}', JSON_EXTRACT(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}') + ?) `
            )
          } else {
            if (fieldTypes[baseName] === 'regular') {
              updateExprArray.push(
                `${escapeId(baseName)} = CAST((${escapeId(
                  baseName
                )} + ?) AS JSON) `
              )
            } else {
              updateExprArray.push(
                `${escapeId(baseName)} = ${escapeId(baseName)} + ? `
              )
            }
          }
          updateValues.push(fieldValue)
          break
        }

        default:
          break
      }
    }
  }

  return {
    updateExpr: updateExprArray.join(', '),
    updateValues
  }
}

const buildUpsertDocument = (searchExpression, updateExpression) => {
  const isSearchDocument =
    Object.keys(searchExpression).filter(key => key.indexOf('$') > -1)
      .length === 0

  const baseDocument = {
    ...(isSearchDocument ? searchExpression : {}),
    ...(updateExpression['$set'] || {})
  }

  const resultDocument = {}

  for (const key of Object.keys(baseDocument)) {
    const nestedKeys = key.split('.')
    nestedKeys.reduce(
      (acc, val, idx) =>
        acc.hasOwnProperty(val)
          ? acc[val]
          : (acc[val] = isNaN(Number(nestedKeys[idx + 1]))
              ? nestedKeys.length - 1 == idx
                ? baseDocument[key]
                : {}
              : []),
      resultDocument
    )
  }

  return resultDocument
}

const convertBinaryRow = row => Object.setPrototypeOf(row, Object.prototype)

const find = async (
  { connection, escapeId, metaInfo },
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const fieldTypes = metaInfo.tables[tableName]

  let selectExpression =
    fieldList && Object.keys(fieldList).length > 0
      ? Object.keys(fieldList)
          .filter(fieldName => fieldList[fieldName] === 1)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            if (nestedPath.length === 0) return escapeId(baseName)
            return `${escapeId(baseName)}->'${makeNestedPath(
              nestedPath
            )}' AS ${escapeId(fieldName)}`
          })
          .join(', ')
      : '*'

  if (selectExpression.trim() === '') {
    selectExpression = 'NULL'
  }

  const orderExpression =
    sort && Object.keys(sort).length > 0
      ? 'ORDER BY ' +
        Object.keys(sort)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            const provisionedName =
              nestedPath.length === 0
                ? escapeId(baseName)
                : `${escapeId(baseName)}->'${makeNestedPath(nestedPath)}'`
            return sort[fieldName] > 0
              ? `${provisionedName} ASC`
              : `${provisionedName} DESC`
          })
          .join(', ')
      : ''

  const skipLimit = `LIMIT ${isFinite(skip) ? skip : 0},${
    isFinite(limit) ? limit : MAX_LIMIT_VALUE
  }`

  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const [rows] = await connection.execute(
    `SELECT ${selectExpression} FROM ${escapeId(tableName)}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit}
  `,
    searchValues
  )

  for (let idx = 0; idx < rows.length; idx++) {
    rows[idx] = convertBinaryRow(rows[idx])
  }

  return rows
}

const findOne = async (
  { connection, escapeId, metaInfo },
  tableName,
  searchExpression,
  fieldList
) => {
  const fieldTypes = metaInfo.tables[tableName]

  let selectExpression =
    fieldList && Object.keys(fieldList).length > 0
      ? Object.keys(fieldList)
          .filter(fieldName => fieldList[fieldName] === 1)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            if (nestedPath.length === 0) return escapeId(baseName)
            return `${escapeId(baseName)}->'${makeNestedPath(
              nestedPath
            )}' AS ${escapeId(fieldName)}`
          })
          .join(', ')
      : '*'

  if (selectExpression.trim() === '') {
    selectExpression = 'NULL'
  }

  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const [rows] = await connection.execute(
    `SELECT ${selectExpression} FROM ${escapeId(tableName)}
    ${inlineSearchExpr}
    LIMIT 0, 1
  `,
    searchValues
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return convertBinaryRow(rows[0])
  }

  return null
}

const count = async (
  { connection, escapeId, metaInfo },
  tableName,
  searchExpression
) => {
  const fieldTypes = metaInfo.tables[tableName]

  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const [rows] = await connection.execute(
    `SELECT Count(*) AS Count FROM ${escapeId(tableName)}
    ${inlineSearchExpr}
  `,
    searchValues
  )

  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows[0] &&
    Number.isInteger(+rows[0].Count)
  ) {
    return +rows[0].Count
  }

  return 0
}

const insert = async (
  { connection, escapeId, metaInfo },
  tableName,
  document
) => {
  const fieldTypes = metaInfo.tables[tableName]

  await connection.execute(
    `INSERT INTO ${escapeId(tableName)}(${Object.keys(document)
      .map(key => escapeId(key))
      .join(', ')})
     VALUES(${Object.keys(document)
       .map(key => (fieldTypes[key] === 'regular' ? 'CAST(? AS JSON)' : '?'))
       .join(', ')})
    `,
    Object.keys(document).map(
      key =>
        fieldTypes[key] === 'regular'
          ? JSON.stringify(document[key])
          : document[key]
    )
  )
}

const update = async (
  { connection, escapeId, metaInfo },
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const fieldTypes = metaInfo.tables[tableName]
  const isUpsert = !!options.upsert

  if (isUpsert) {
    const foundDocumentsCount = await count(
      { connection, escapeId, metaInfo },
      tableName,
      searchExpression
    )

    if (foundDocumentsCount === 0) {
      const document = buildUpsertDocument(
        searchExpression,
        updateExpression,
        fieldTypes,
        escapeId
      )
      await insert({ connection, escapeId, metaInfo }, tableName, document)
      return
    }
  }

  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId
  )
  const { updateExpr, updateValues } = updateToSetExpression(
    updateExpression,
    fieldTypes,
    escapeId
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await connection.execute(
    `UPDATE ${escapeId(tableName)} SET ${updateExpr} ${inlineSearchExpr}`,
    [...updateValues, ...searchValues]
  )
}

const del = async (
  { connection, escapeId, metaInfo },
  tableName,
  searchExpression
) => {
  const fieldTypes = metaInfo.tables[tableName]

  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await connection.execute(
    `DELETE FROM ${escapeId(tableName)} ${inlineSearchExpr}`,
    searchValues
  )
}

export default {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  del
}
