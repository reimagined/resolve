import mysql from 'mysql2/promise'
import { escapeId, escape } from 'mysql2'
import createAdapter from 'resolve-readmodel-base'

const dropReadModel = async ({ runQuery, escapeId }, readModelName) => {
  const rows = await runQuery(
    readModelName,
    `SELECT table_name AS \`tableName\` FROM INFORMATION_SCHEMA.TABLES
    WHERE table_comment LIKE "RESOLVE-${readModelName}"
    AND table_schema=DATABASE()`
  )

  for (const { tableName } of rows) {
    await runQuery(`DROP TABLE ${escapeId(tableName)}`)
  }
}

const runQuery = async (pool, readModelName, querySQL) => {
  const connection = await pool.connectionPromise
  const [rows] = await connection.query(querySQL)
  return rows
}

const setupConnection = async pool => {
  pool.connectionPromise = pool.mysql.createConnection({
    ...pool.connectionOptions,
    multipleStatements: false
  })
  const connection = await pool.connectionPromise

  connection.onerror = async err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      return await setupConnection(pool)
    }

    pool.lastMysqlError = err
    // eslint-disable-next-line no-console
    console.warn('SQL error: ', err)
  }
}

const connect = async (pool, options) => {
  let { checkStoredTableSchema, tablePrefix, ...connectionOptions } = options

  if (
    tablePrefix == null ||
    (tablePrefix != null && tablePrefix.constructor !== String)
  ) {
    tablePrefix = ''
  }

  Object.assign(pool, {
    runQuery: runQuery.bind(null, pool),
    connectionOptions,
    tablePrefix,
    escapeId,
    escape,
    mysql
  })

  await setupConnection(pool)
}

const disconnect = async pool => {
  const connection = await pool.connectionPromise
  await connection.end()
}

const drop = async ({ runQuery, escapeId }) => {
  const rows = await runQuery(
    readModelName,
    `SELECT table_name AS \`tableName\` FROM INFORMATION_SCHEMA.TABLES
    WHERE table_comment LIKE "RESOLVE-%"
    AND table_schema=DATABASE()`
  )

  for (const { tableName } of rows) {
    await runQuery(`DROP TABLE ${escapeId(tableName)}`)
  }
}

const STRING_INDEX_TYPE =
  'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
const NUMBER_INDEX_TYPE = 'BIGINT'
const MAX_LIMIT_VALUE = 0x0fffffff | 0

const defineTable = async (
  { runQuery, tablePrefix, escapeId },
  readModelName,
  tableName,
  tableDescription
) => {
  if (
    tableDescription == null ||
    tableDescription.constructor !== Object ||
    tableDescription.indexes == null ||
    tableDescription.indexes.constructor !== Object ||
    !Array.isArray(tableDescription.fields)
  ) {
    throw new Error(`Wrong table description ${tableDescription}`)
  }

  await runQuery(
    readModelName,
    `CREATE TABLE ${escapeId(`${tablePrefix}${tableName}`)} (` +
      [
        tableDescription.fields
          .map(columnName => `${escapeId(columnName)} JSON`)
          .join(',\n'),
        Object.keys(tableDescription.indexes)
          .map((indexName, idx) => {
            let declaration = `${escapeId(indexName)} JSON, ${escapeId(
              `${indexName}\u0004`
            )} `
            switch (tableDescription.indexes[indexName]) {
              case 'string':
                declaration += STRING_INDEX_TYPE
                break
              case 'number':
                declaration += NUMBER_INDEX_TYPE
                break
              default:
                throw new Error(
                  `Wrong index "${indexName}" type "${
                    tableDescription.indexes[indexName]
                  }"`
                )
            }
            declaration += ` GENERATED ALWAYS AS (${escapeId(
              indexName
            )}->"$") STORED `
            if (idx === 0) {
              declaration += ' NOT NULL PRIMARY KEY'
            } else {
              declaration += ' NULL'
            }
            return declaration
          })
          .join(',\n'),
        Object.keys(tableDescription.indexes)
          .map(
            indexName =>
              `INDEX ${escapeId(`${indexName}\u0004\u0004`)} (${escapeId(
                `${indexName}\u0004`
              )})`
          )
          .join(',\n')
      ].join(',\n') +
      `)
      COMMENT = "RESOLVE-${readModelName}"
      ENGINE = "InnoDB"
      `
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

const searchToWhereExpression = (expression, escapeId, escape) => {
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

      const compareInlinedValue =
        fieldValue != null
          ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSON)`
          : `CAST("null" AS JSON)`

      const resultOperator = compareOperatorsMap.get(fieldOperator)

      searchExprArray.push(
        `${resultFieldName} ${resultOperator} ${compareInlinedValue}`
      )
    }

    return searchExprArray.join(' AND ')
  }

  for (let operatorName of Object.keys(expression)) {
    if (operatorName === '$and' || operatorName === '$or') {
      const localSearchExprArray = []
      for (let innerExpr of expression[operatorName]) {
        const whereExpr = searchToWhereExpression(innerExpr, escapeId, escape)
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
        escapeId,
        escape
      )

      searchExprArray.push(`NOT (${whereExpr})`)
      break
    }
  }

  return searchExprArray.join(' AND ')
}

const updateToSetExpression = (expression, escapeId, escape) => {
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
          let updatingInlinedValue =
            fieldValue != null
              ? `CAST(${escape(JSON.stringify(fieldValue))} AS JSON)`
              : null

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

          let updatingInlinedValue = `CAST(CASE
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

const convertBinaryRow = (row, fieldList) => {
  if(fieldList != null && fieldList.constructor !== Object) {
    throw new Error('Field list should be object with enumerated selected fields')
  }

  Object.setPrototypeOf(row, Object.prototype)
  for(const key of Object.keys(row)) {
    if(key.endsWith('\u0004')) {
      delete row[key]
    }
  }

  if(fieldList == null) {
    return row
  }

  const fieldNames = Object.keys(fieldList)
  if(fieldNames.length === 0) {
    return row
  }

  const inclusiveMode = fieldList[fieldNames[0]] === 1
  for(const key of Object.keys(row)) {
    if (!(
      (inclusiveMode && fieldList.hasOwnProperty(key)) ||
      (!inclusiveMode && !fieldList.hasOwnProperty(key))
    )) {
      delete row[key]
    }
  }

  return row
}

const find = async (
  { runQuery, escapeId, escape, tablePrefix },
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
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

  const searchExpr = searchToWhereExpression(searchExpression, escapeId, escape)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await runQuery(
    readModelName,
    `SELECT * FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit}`
  )

  for (let idx = 0; idx < rows.length; idx++) {
    rows[idx] = convertBinaryRow(rows[idx], fieldList)
  }

  return rows
}

const findOne = async (
  { runQuery, escapeId, escape, tablePrefix },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const searchExpr = searchToWhereExpression(searchExpression, escapeId, escape)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await runQuery(
    readModelName,
    `SELECT * FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    LIMIT 0, 1`
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return convertBinaryRow(rows[0], fieldList)
  }

  return null
}

const count = async (
  { runQuery, escapeId, escape, tablePrefix },
  readModelName,
  tableName,
  searchExpression
) => {
  const searchExpr = searchToWhereExpression(searchExpression, escapeId, escape)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await runQuery(
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
  { runQuery, escapeId, escape, tablePrefix },
  readModelName,
  tableName,
  document
) => {
  await runQuery(
    readModelName,
    `INSERT INTO ${escapeId(`${tablePrefix}${tableName}`)}(${Object.keys(
      document
    )
      .map(key => escapeId(key))
      .join(', ')})
     VALUES(${Object.keys(document)
       .map(key => `CAST(${escape(JSON.stringify(document[key]))} AS JSON)`)
       .join(', ')})
    `
  )
}

const update = async (
  { runQuery, tablePrefix, escapeId, escape },
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const isUpsert = options != null ? !!options.upsert : false

  if (isUpsert) {
    const foundDocumentsCount = await count(
      { runQuery, escapeId, tablePrefix, escape },
      readModelName,
      tableName,
      searchExpression
    )

    if (foundDocumentsCount === 0) {
      const document = buildUpsertDocument(searchExpression, updateExpression)
      await insert(
        {
          runQuery,
          escapeId,
          tablePrefix,
          escape
        },
        readModelName,
        tableName,
        document
      )
      return
    }
  }

  const searchExpr = searchToWhereExpression(searchExpression, escapeId, escape)
  const updateExpr = updateToSetExpression(updateExpression, escapeId, escape)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await runQuery(
    readModelName,
    `UPDATE ${escapeId(`${tablePrefix}${tableName}`)}
    SET ${updateExpr} ${inlineSearchExpr}`
  )
}

const del = async (
  { runQuery, tablePrefix, escapeId, escape },
  readModelName,
  tableName,
  searchExpression
) => {
  const searchExpr = searchToWhereExpression(searchExpression, escapeId, escape)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await runQuery(
    readModelName,
    `DELETE FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}`
  )
}

export default createAdapter.bind(null, {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  delete: del,
  connect,
  dropReadModel,
  disconnect,
  drop
})
