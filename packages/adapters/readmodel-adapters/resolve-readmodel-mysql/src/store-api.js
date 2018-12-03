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
  { queryTransactionalDDL, tablePrefix, escapeId },
  readModelName,
  tableName,
  tableDescription
) => {
  await queryTransactionalDDL(
    readModelName,
    `CREATE TABLE ${escapeId(`${tablePrefix}${tableName}`)} (\n` +
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
          .map(columnName => {
            const columnType = tableDescription[columnName]
            if (
              columnType === 'primary-string' ||
              columnType === 'primary-number'
            ) {
              return `PRIMARY KEY (${escapeId(columnName)})`
            } else {
              return `INDEX USING BTREE (${escapeId(columnName)})`
            }
          })
          .join(',\n')
      ].join(',\n') +
      `\n)`
  )
}

const makeNestedPath = nestedPath =>
  `$.${nestedPath.map(JSON.stringify).join('.')}`

const compareOperatorsMap = new Map([
  ['$eq', '='],
  ['$ne', '<>'],
  ['$lte', '<='],
  ['$gte', '>='],
  ['$lt', '<'],
  ['$gt', '>']
])

const searchToWhereExpression = (expression, fieldTypes, escapeId, escape) => {
  const searchExprArray = []
  const isDocumentExpr =
    expression.$and == null && expression.$or == null && expression.$not == null

  if (isDocumentExpr) {
    for (let fieldName of Object.keys(expression)) {
      const [baseName, ...nestedPath] = fieldName.split('.')
      const resultFieldName =
        nestedPath.length > 0
          ? `${escapeId(baseName)}->'${makeNestedPath(nestedPath)}'`
          : escapeId(baseName)

      let fieldValue = expression[fieldName]
      let fieldOperator = '$eq'

      if (fieldValue instanceof Object) {
        fieldOperator = Object.keys(fieldValue)[0]
        fieldValue = fieldValue[fieldOperator]
      }

      let compareInlinedValue = null
      switch (
        `${fieldValue == null ? 'null' : 'val'}-${fieldTypes[baseName]}`
      ) {
        case 'val-primary-string':
        case 'val-secondary-string':
          compareInlinedValue = `${escape(fieldValue)}`
          break
        case 'val-primary-number':
        case 'val-secondary-number':
          compareInlinedValue = `${+fieldValue}`
          break
        case 'val-regular':
          compareInlinedValue = `CAST(${escape(
            JSON.stringify(fieldValue)
          )} AS JSON)`
          break
        case 'null-secondary-string':
        case 'null-secondary-number':
        case 'null-regular':
          break
        default: {
          throw new Error(`Wrong type ${fieldTypes[baseName]}`)
        }
      }

      if (compareInlinedValue != null) {
        const resultOperator = compareOperatorsMap.get(fieldOperator)
        searchExprArray.push(
          `${resultFieldName} ${resultOperator} ${compareInlinedValue}`
        )
      } else {
        searchExprArray.push(`${resultFieldName} IS NULL`)
      }
    }

    return searchExprArray.join(' AND ')
  }

  for (let operatorName of Object.keys(expression)) {
    if (operatorName === '$and' || operatorName === '$or') {
      const localSearchExprArray = []
      for (let innerExpr of expression[operatorName]) {
        const whereExpr = searchToWhereExpression(
          innerExpr,
          fieldTypes,
          escapeId,
          escape
        )
        localSearchExprArray.push(whereExpr)
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
        escapeId,
        escape
      )

      searchExprArray.push(`NOT (${whereExpr})`)
      break
    }
  }

  return searchExprArray.join(' AND ')
}

const updateToSetExpression = (expression, fieldTypes, escapeId, escape) => {
  const updateExprArray = []

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
          let updatingInlinedValue = null
          switch (fieldTypes[baseName]) {
            case 'primary-string':
            case 'secondary-string':
              updatingInlinedValue = `${escape(fieldValue)}`
              break
            case 'primary-number':
            case 'secondary-number':
              updatingInlinedValue = `${+fieldValue}`
              break
            case 'regular':
              updatingInlinedValue = `CAST(${escape(
                JSON.stringify(fieldValue)
              )} AS JSON)`
              break
            default: {
              throw new Error(`Wrong type ${fieldTypes[baseName]}`)
            }
          }

          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = JSON_SET(${escapeId(
                baseName
              )}, '${makeNestedPath(nestedPath)}', ${updatingInlinedValue}) `
            )
          } else {
            updateExprArray.push(
              `${escapeId(baseName)} = ${updatingInlinedValue} `
            )
          }

          break
        }

        case '$inc': {
          const sourceInlinedValue =
            nestedPath.length > 0
              ? `JSON_EXTRACT(${escapeId(baseName)}, '${makeNestedPath(
                  nestedPath
                )}')`
              : escapeId(baseName)

          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = JSON_SET(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}', `
              : `${escapeId(baseName)} = `

          const targetInlinedPostfix = nestedPath.length > 0 ? ')' : ''

          let updatingInlinedValue = null
          switch (fieldTypes[baseName]) {
            case 'primary-string':
            case 'secondary-string':
              updatingInlinedValue = `CAST(CONCAT(
                CAST(${sourceInlinedValue} AS ${STRING_INDEX_TYPE}),
                CAST(${escape(fieldValue)} AS ${STRING_INDEX_TYPE})
              ) AS ${STRING_INDEX_TYPE})`
              break

            case 'primary-number':
            case 'secondary-number':
              updatingInlinedValue = `CAST((
                CAST(${sourceInlinedValue} AS ${NUMBER_INDEX_TYPE}) +
                CAST(${+fieldValue} AS ${NUMBER_INDEX_TYPE})
              ) AS ${NUMBER_INDEX_TYPE})`
              break

            case 'regular':
              updatingInlinedValue = `CAST(CASE
                WHEN JSON_TYPE(${sourceInlinedValue}) = 'STRING' THEN JSON_QUOTE(CONCAT(
                  CAST(JSON_UNQUOTE(${sourceInlinedValue}) AS CHAR),
                  CAST(${escape(fieldValue)} AS CHAR)
                ))
                WHEN JSON_TYPE(${sourceInlinedValue}) = 'INTEGER' THEN (
                  CAST(${sourceInlinedValue} AS UNSIGNED) +
                  CAST(${+fieldValue} AS UNSIGNED)
                )
                WHEN JSON_TYPE(${sourceInlinedValue}) = 'DOUBLE' THEN (
                  CAST(${sourceInlinedValue} AS DECIMAL(48, 16)) +
                  CAST(${+fieldValue} AS DECIMAL(48, 16))
                )
                ELSE (
                  SELECT 'Invalid JSON type for $inc operation' 
                  FROM information_schema.tables
                )
              END AS JSON)`
              break

            default: {
              throw new Error(`Wrong type ${fieldTypes[baseName]}`)
            }
          }

          updateExprArray.push(
            `${targetInlinedPrefix} ${updatingInlinedValue} ${targetInlinedPostfix}`
          )

          break
        }

        default:
          break
      }
    }
  }

  return updateExprArray.join(', ')
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
              ? nestedKeys.length - 1 === idx
                ? baseDocument[key]
                : {}
              : []),
      resultDocument
    )
  }

  return resultDocument
}

const convertBinaryRow = row => Object.setPrototypeOf(row, Object.prototype)

const fieldToSelectExpression = (fieldList, fieldTypes, escapeId) => {
  if (fieldList == null) {
    return '*'
  }

  let selectExpression = ''
  const fieldListKeys = Object.keys(fieldList)

  if (fieldListKeys.length > 0) {
    const inclusiveMode = fieldList[fieldListKeys[0]] === 1
    const selectedFields = []
    for (const fieldName of Object.keys(fieldTypes)) {
      if (
        (inclusiveMode && fieldList.hasOwnProperty(fieldName)) ||
        (!inclusiveMode && !fieldList.hasOwnProperty(fieldName))
      ) {
        const [baseName, ...nestedPath] = fieldName.split('.')
        if (nestedPath.length === 0) {
          selectedFields.push(escapeId(baseName))
        } else {
          selectedFields.push(
            `${escapeId(baseName)}->'${makeNestedPath(
              nestedPath
            )}' AS ${escapeId(fieldName)}`
          )
        }
      }
    }

    selectExpression = selectedFields.join(', ')
  }

  if (selectExpression.trim() === '') {
    selectExpression = 'NULL'
  }

  return selectExpression
}

const find = async (
  { queryTransactionalDML, escapeId, escape, tablePrefix, tableInfoCache },
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const fieldTypes = tableInfoCache.get(readModelName).get(tableName)
  const selectExpression = fieldToSelectExpression(
    fieldList,
    fieldTypes,
    escapeId
  )

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

  const searchExpr = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId,
    escape
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await queryTransactionalDML(
    readModelName,
    `SELECT ${selectExpression} FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit}`
  )

  for (let idx = 0; idx < rows.length; idx++) {
    rows[idx] = convertBinaryRow(rows[idx])
  }

  return rows
}

const findOne = async (
  { queryTransactionalDML, escapeId, escape, tablePrefix, tableInfoCache },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const fieldTypes = tableInfoCache.get(readModelName).get(tableName)
  const selectExpression = fieldToSelectExpression(
    fieldList,
    fieldTypes,
    escapeId
  )

  const searchExpr = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId,
    escape
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await queryTransactionalDML(
    readModelName,
    `SELECT ${selectExpression} FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    LIMIT 0, 1`
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return convertBinaryRow(rows[0])
  }

  return null
}

const count = async (
  { queryTransactionalDML, escapeId, escape, tablePrefix, tableInfoCache },
  readModelName,
  tableName,
  searchExpression
) => {
  const fieldTypes = tableInfoCache.get(readModelName).get(tableName)

  const searchExpr = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId,
    escape
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await queryTransactionalDML(
    readModelName,
    `SELECT Count(*) AS Count FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}`
  )

  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows[0] != null &&
    Number.isInteger(+rows[0].Count)
  ) {
    return +rows[0].Count
  }

  return 0
}

const insert = async (
  { queryTransactionalDML, escapeId, escape, tablePrefix, tableInfoCache },
  readModelName,
  tableName,
  document
) => {
  const fieldTypes = tableInfoCache.get(readModelName).get(tableName)

  await queryTransactionalDML(
    readModelName,
    `INSERT INTO ${escapeId(`${tablePrefix}${tableName}`)}(${Object.keys(
      document
    )
      .map(key => escapeId(key))
      .join(', ')})
     VALUES(${Object.keys(document)
       .map(key =>
         fieldTypes[key] === 'regular'
           ? `CAST(${escape(JSON.stringify(document[key]))} AS JSON)`
           : `${escape(document[key])}`
       )
       .join(', ')})
    `
  )
}

const update = async (
  { queryTransactionalDML, tablePrefix, escapeId, escape, tableInfoCache },
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const fieldTypes = tableInfoCache.get(readModelName).get(tableName)
  const isUpsert = !!options.upsert

  if (isUpsert) {
    const foundDocumentsCount = await count(
      { queryTransactionalDML, escapeId, tablePrefix, escape, tableInfoCache },
      readModelName,
      tableName,
      searchExpression
    )

    if (foundDocumentsCount === 0) {
      const document = buildUpsertDocument(searchExpression, updateExpression)
      await insert(
        {
          queryTransactionalDML,
          escapeId,
          tablePrefix,
          escape,
          tableInfoCache
        },
        readModelName,
        tableName,
        document
      )
      return
    }
  }

  const searchExpr = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId,
    escape
  )
  const updateExpr = updateToSetExpression(
    updateExpression,
    fieldTypes,
    escapeId,
    escape
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await queryTransactionalDML(
    readModelName,
    `UPDATE ${escapeId(`${tablePrefix}${tableName}`)}
    SET ${updateExpr} ${inlineSearchExpr}`
  )
}

const del = async (
  { queryTransactionalDML, tablePrefix, escapeId, escape, tableInfoCache },
  readModelName,
  tableName,
  searchExpression
) => {
  const fieldTypes = tableInfoCache.get(readModelName).get(tableName)

  const searchExpr = searchToWhereExpression(
    searchExpression,
    fieldTypes,
    escapeId,
    escape
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await queryTransactionalDML(
    readModelName,
    `DELETE FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}`
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
