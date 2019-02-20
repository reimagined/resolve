import createAdapter from 'resolve-readmodel-base'
import sqlite from 'sqlite'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const dropReadModel = async ({ runQuery, escapeId }, readModelName) => {
  const rows = await runQuery(
    `SELECT name FROM sqlite_master WHERE type=${escape('table')}
    AND sql LIKE ${escape(
      `${escapeId(`RESOLVE-${readModelName}`)} BOOLEAN NOT NULL DEFAULT(true)`
    )}
    AND name NOT LIKE ${escape('sqlite_%')}`
  )

  for (const { name } of rows) {
    await runQuery(`DROP TABLE ${escapeId(name)}`)
  }
}

const runQuery = async (pool, querySQL) => {
  const rows = Array.from(await pool.connection.all(querySQL))
  return rows
}

const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? '' : obj

const connect = async (pool, options) => {
  let { tablePrefix, databaseFile, ...connectionOptions } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  Object.assign(pool, {
    connection: await sqlite.open(databaseFile),
    runQuery: runQuery.bind(null, pool),
    connectionOptions,
    tablePrefix,
    databaseFile,
    sqlite,
    escapeId,
    escape
  })

  await pool.connection.exec(`PRAGMA encoding=${escape('UTF-8')}`)
}

const disconnect = async pool => {
  await pool.connection.close()
}

const drop = async ({ runQuery, escapeId }) => {
  const rows = await runQuery(
    `SELECT name FROM sqlite_master WHERE type=${escape('table')}
    AND sql LIKE ${escape(
      `${escapeId('RESOLVE-%')} BOOLEAN NOT NULL DEFAULT(true)`
    )}
    AND name NOT LIKE ${escape('sqlite_%')}`
  )

  for (const { name } of rows) {
    await runQuery(`DROP TABLE ${escapeId(name)}`)
  }
}

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
    `CREATE TABLE ${escapeId(`${tablePrefix}${tableName}`)} (
      ${escapeId(`RESOLVE-${readModelName}`)} BOOLEAN NOT NULL DEFAULT(true), 
      ${tableDescription.fields
        .concat(Object.keys(tableDescription.indexes))
        .map(columnName => `${escapeId(columnName)} JSON`)
        .join(',\n')}
    )`
  )

  for (const indexName of Object.keys(tableDescription.indexes)) {
    const indexType = tableDescription.indexes[indexName]
    if (indexType !== 'string' && indexType !== 'number') {
      throw new Error(
        `Wrong index "${indexName}" type "${
          tableDescription.indexes[indexName]
        }"`
      )
    }

    const baseIndexName = postfix =>
      escapeId(`${tablePrefix}${tableName}-${indexName}-${postfix}`)

    await runQuery(
      `CREATE INDEX ${baseIndexName('type-validation')}
       ON ${escapeId(`${tablePrefix}${tableName}`)}(
         CAST(json_extract(${escapeId(indexName)}, '$') AS ${
        indexType === 'number' ? 'NUMERIC' : 'TEXT'
      })
       )`
    )

    await runQuery(
      `CREATE INDEX ${baseIndexName('extracted-field')}
       ON ${escapeId(`${tablePrefix}${tableName}`)}(
         json_extract(${escapeId(indexName)}, '$')
       )`
    )

    await runQuery(
      `CREATE INDEX ${baseIndexName('full-field')}
       ON ${escapeId(`${tablePrefix}${tableName}`)}(
         ${escapeId(indexName)}
       )`
    )
  }
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
          ? `json_extract(${escapeId(baseName)}, '${makeNestedPath(
              nestedPath
            )}')`
          : escapeId(baseName)

      let fieldValue = expression[fieldName]
      let fieldOperator = '$eq'

      if (fieldValue instanceof Object) {
        fieldOperator = Object.keys(fieldValue)[0]
        fieldValue = fieldValue[fieldOperator]
      }

      const compareInlinedValue =
        fieldValue != null
          ? `json(CAST(${escape(JSON.stringify(fieldValue))} AS BLOB))`
          : `json(CAST(${escape('null')} AS BLOB))`

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
              `${escapeId(baseName)} = json_remove(${escapeId(
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
              ? `json(CAST(${escape(JSON.stringify(fieldValue))} AS BLOB))`
              : null

          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${escapeId(baseName)} = json_set(${escapeId(
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
              ? `json_extract(${escapeId(baseName)}, '${makeNestedPath(
                  nestedPath
                )}')`
              : escapeId(baseName)

          const targetInlinedPrefix =
            nestedPath.length > 0
              ? `${escapeId(baseName)} = json_set(${escapeId(
                  baseName
                )}, '${makeNestedPath(nestedPath)}', `
              : `${escapeId(baseName)} = `

          const targetInlinedPostfix = nestedPath.length > 0 ? ')' : ''

          let updatingInlinedValue = `json(CAST(CASE
            WHEN json_type(${sourceInlinedValue}) = 'text' THEN (
              CAST(${sourceInlinedValue} AS TEXT) +
              CAST(${escape(fieldValue)} AS TEXT)
            )
            WHEN json_type(${sourceInlinedValue}) = 'integer' THEN (
              CAST(${sourceInlinedValue} AS INTEGER) +
              CAST(${+fieldValue} AS INTEGER)
            )
            WHEN json_type(${sourceInlinedValue}) = 'real' THEN (
              CAST(${sourceInlinedValue} AS REAL) +
              CAST(${+fieldValue} AS REAL)
            )
            ELSE (
              SELECT 'Invalid JSON type for $inc operation' 
              FROM sqlite_master
            )
          END AS BLOB))`

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

const convertBinaryRow = (row, readModelName, fieldList) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }

  Object.setPrototypeOf(row, Object.prototype)
  delete row[`RESOLVE-${readModelName}`]
  for (const key of Object.keys(row)) {
    row[key] = JSON.parse(row[key])
  }

  if (fieldList == null) {
    return row
  }

  const fieldNames = Object.keys(fieldList)
  if (fieldNames.length === 0) {
    return row
  }

  const inclusiveMode = fieldList[fieldNames[0]] === 1
  for (const key of Object.keys(row)) {
    if (
      !(
        (inclusiveMode && fieldList.hasOwnProperty(key)) ||
        (!inclusiveMode && !fieldList.hasOwnProperty(key))
      )
    ) {
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
              nestedPath.length > 0
                ? `json_extract(${escapeId(baseName)}, '${makeNestedPath(
                    nestedPath
                  )}')`
                : escapeId(baseName)
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
    `SELECT * FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit}`
  )

  for (let idx = 0; idx < rows.length; idx++) {
    rows[idx] = convertBinaryRow(rows[idx], readModelName, fieldList)
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
    `SELECT * FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    LIMIT 0, 1`
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return convertBinaryRow(rows[0], readModelName, fieldList)
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
    `INSERT INTO ${escapeId(`${tablePrefix}${tableName}`)}(${Object.keys(
      document
    )
      .map(key => escapeId(key))
      .join(', ')})
     VALUES(${Object.keys(document)
       .map(
         key => `json(CAST(${escape(JSON.stringify(document[key]))} AS BLOB))`
       )
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
