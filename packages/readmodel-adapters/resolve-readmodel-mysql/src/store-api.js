const MAX_VALUE = 0x0fffffff | 0
const castType = type => {
  switch (type) {
    case 'number':
      return 'BIGINT NOT NULL'
    case 'string':
      return 'VARCHAR(255) NOT NULL'
    case 'json':
      return 'JSON NULL'
    default:
      return 'VARCHAR(255) NOT NULL'
  }
}

const defineTable = async (
  { connection, escapeId },
  tableName,
  tableSchema
) => {
  await connection.execute(
    `CREATE TABLE ${escapeId(tableName)} (\n` +
      [
        Object.keys(tableSchema.fieldTypes)
          .map(
            fieldName =>
              `${escapeId(fieldName)} ${castType(
                tableSchema.fieldTypes[fieldName]
              )}`
          )
          .join(',\n'),
        [
          `PRIMARY KEY (${escapeId(tableSchema.primaryIndex.name)})`,
          ...tableSchema.secondaryIndexes.map(
            ({ name }) => `INDEX USING BTREE (${escapeId(name)})`
          )
        ].join(',\n')
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

const searchToWhereExpression = (expr, escapeId) => {
  const searchExprArray = []
  const searchValues = []

  const isDocumentExpr =
    Object.keys(expr).filter(key => key.indexOf('$') > -1).length === 0

  if (isDocumentExpr) {
    for (let fieldName of Object.keys(expr)) {
      const [baseName, ...nestedPath] = fieldName.split('.')
      const resultFieldName =
        nestedPath.length > 0
          ? `${escapeId(baseName)}->>'${makeNestedPath(nestedPath)}'`
          : escapeId(baseName)

      let fieldValue = expr[fieldName]
      let fieldOperator = '='

      if (fieldValue instanceof Object) {
        fieldOperator = Object.keys(fieldValue)[0]
        fieldValue = fieldValue[fieldOperator]
      }

      const resultOperator = makeCompareOperator(fieldOperator)

      searchExprArray.push(`${resultFieldName} ${resultOperator} ?`)

      searchValues.push(fieldValue)
    }

    return {
      searchExpr: searchExprArray.join(' AND '),
      searchValues
    }
  }

  for (let operatorName of Object.keys(expr)) {
    if (operatorName === '$and' || operatorName === '$or') {
      const localSearchExprArray = []
      for (let innerExpr of expr[operatorName]) {
        const whereExpr = searchToWhereExpression(innerExpr, escapeId)
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
      const whereExpr = searchToWhereExpression(expr[operatorName], escapeId)

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

const updateToSetExpression = (expr, escapeId) => {
  const updateExprArray = []
  const updateValues = []

  for (let operatorName of Object.keys(expr)) {
    for (let fieldName of Object.keys(expr[operatorName])) {
      const fieldValue = expr[operatorName][fieldName]
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
              )}, '${makeNestedPath(nestedPath)}', ?) `
            )
          } else {
            updateExprArray.push(`${escapeId(baseName)} = ? `)
          }
          updateValues.push(fieldValue)
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
            updateExprArray.push(
              `${escapeId(baseName)} = ${escapeId(baseName)} + ? `
            )
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

const find = async (
  { connection, escapeId },
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  let selectExpression =
    fieldList && Object.keys(fieldList).length > 0
      ? Object.keys(fieldList)
          .filter(fieldName => fieldList[fieldName] === 1)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            if (nestedPath.length === 0) return escapeId(baseName)
            return `${escapeId(baseName)}->>'${makeNestedPath(
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
                : `${escapeId(baseName)}->>'${makeNestedPath(nestedPath)}'`
            return sort[fieldName] > 0
              ? `${provisionedName} ASC`
              : `${provisionedName} DESC`
          })
          .join(', ')
      : ''

  const skipLimit = `LIMIT ${isFinite(skip) ? skip : 0},${
    isFinite(limit) ? limit : MAX_VALUE
  }`

  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
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

  return rows
}

const findOne = async (
  { connection, escapeId },
  tableName,
  searchExpression,
  fieldList
) => {
  let selectExpression =
    fieldList && Object.keys(fieldList).length > 0
      ? Object.keys(fieldList)
          .filter(fieldName => fieldList[fieldName] === 1)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            if (nestedPath.length === 0) return escapeId(baseName)
            return `${escapeId(baseName)}->>'${makeNestedPath(
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
    return rows[0]
  }

  return null
}

const count = async ({ connection, escapeId }, tableName, searchExpression) => {
  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
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

const insert = async ({ connection, escapeId }, tableName, document) => {
  await connection.execute(
    `INSERT INTO ${escapeId(tableName)}(${Object.keys(document)
      .map(key => escapeId(key))
      .join(', ')})
     VALUES(${Object.keys(document)
       .map(() => '?')
       .join(', ')})
    `,
    Object.values(document)
  )
}

const update = async (
  { connection, escapeId },
  tableName,
  searchExpression,
  updateExpression
) => {
  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
    escapeId
  )
  const { updateExpr, updateValues } = updateToSetExpression(
    updateExpression,
    escapeId
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await connection.execute(
    `UPDATE ${escapeId(tableName)} SET ${updateExpr} ${inlineSearchExpr}`,
    [...updateValues, ...searchValues]
  )
}

const del = async ({ connection, escapeId }, tableName, searchExpression) => {
  const { searchExpr, searchValues } = searchToWhereExpression(
    searchExpression,
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
