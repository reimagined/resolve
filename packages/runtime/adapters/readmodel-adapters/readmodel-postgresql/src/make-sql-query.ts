import type {
  MakeSqlQueryMethodTargetParameters,
  MakeSqlQueryMethod,
} from './types'

const STRING_INDEX_TYPE = 'VARCHAR(190)'
const NUMBER_INDEX_TYPE = 'BIGINT'
const MAX_LIMIT_VALUE = 0x0fffffff | 0

const makeSqlQuery: MakeSqlQueryMethod = (
  {
    searchToWhereExpression,
    updateToSetExpression,
    buildUpsertDocument,
    splitNestedPath,
    makeNestedPath,
    escapeId,
    escapeStr,
    schemaName,
    tablePrefix,
  },
  readModelName,
  operation,
  ...inputArgs
) => {
  const args: unknown = inputArgs
  switch (operation) {
    case 'defineTable': {
      const [
        tableName,
        tableDescription,
      ] = args as MakeSqlQueryMethodTargetParameters<'defineTable'>

      if (
        tableDescription == null ||
        tableDescription.constructor !== Object ||
        tableDescription.indexes == null ||
        tableDescription.indexes.constructor !== Object ||
        !Array.isArray(tableDescription.fields)
      ) {
        throw new Error(`Wrong table description ${tableDescription}`)
      }
      const { fields, indexes } = tableDescription

      const sqlQuery = `
      CREATE TABLE ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )} (
        ${fields
          .concat(Object.keys(indexes))
          .map((columnName) => `${escapeId(columnName)} JSONB`)
          .join(', ')}
      );
  
      ${Object.entries(indexes)
        .map(
          ([indexName, indexType], idx) => `
        ALTER TABLE ${escapeId(schemaName)}.${escapeId(
            `${tablePrefix}${tableName}`
          )}
        ADD CONSTRAINT ${escapeId(`${indexName}-type-validation`)}
        CHECK (${
          idx > 0
            ? `jsonb_typeof(${escapeId(indexName)}) = ${escapeStr('null')} OR `
            : ''
        }jsonb_typeof(${escapeId(indexName)}) = ${escapeStr(
            indexType === 'number' ? 'number' : 'string'
          )});
  
        CREATE ${idx === 0 ? 'UNIQUE' : ''} INDEX ${escapeId(
            `${tablePrefix}${tableName}-${indexName}-extracted-field`
          )}
        ON ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)} (
        CAST((${escapeId(indexName)} ->> '$') AS ${
            indexType === 'number' ? NUMBER_INDEX_TYPE : STRING_INDEX_TYPE
          }));
       
        CREATE ${idx === 0 ? 'UNIQUE' : ''} INDEX ${escapeId(
            `${tablePrefix}${tableName}-${indexName}-full-field`
          )}
        ON ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)} (
          ${escapeId(indexName)}
        );
      `
        )
        .join('\n')}
  
      COMMENT ON TABLE ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}
      IS ${escapeStr(`RESOLVE-${readModelName}`)};
    `

      return sqlQuery
    }

    case 'find': {
      const [
        tableName,
        searchExpression,
        fieldList,
        sort,
        inputSkip,
        inputLimit,
      ] = args as MakeSqlQueryMethodTargetParameters<'find'>

      const orderExpression =
        sort && Object.keys(sort).length > 0
          ? 'ORDER BY ' +
            Object.keys(sort)
              .map((fieldName) => {
                const [baseName, ...nestedPath] = splitNestedPath(fieldName)
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

      const searchExpr = searchToWhereExpression(
        searchExpression,
        escapeId,
        escapeStr,
        makeNestedPath,
        splitNestedPath
      )

      const inlineSearchExpr =
        searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

      const baseQuery = `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}
    ${inlineSearchExpr}
    ${orderExpression}
    `

      const skipNumber = isFinite(+(inputSkip as number))
        ? +(inputSkip as number)
        : 0
      const limitNumber = isFinite(+(inputLimit as number))
        ? +(inputLimit as number)
        : MAX_LIMIT_VALUE

      const skipStr = `OFFSET ${skipNumber}`.padEnd(18, ' ')
      const limitStr = `LIMIT ${limitNumber}`.padEnd(18, ' ')

      const sqlQuery = `${baseQuery} ${skipStr}${limitStr}`

      void fieldList

      return sqlQuery
    }

    case 'findOne': {
      const [
        tableName,
        searchExpression,
        fieldList,
      ] = args as MakeSqlQueryMethodTargetParameters<'findOne'>

      const searchExpr = searchToWhereExpression(
        searchExpression,
        escapeId,
        escapeStr,
        makeNestedPath,
        splitNestedPath
      )

      const inlineSearchExpr =
        searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

      const sqlQuery = `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}
        ${inlineSearchExpr}
        OFFSET 0
        LIMIT 1;`

      void fieldList

      return sqlQuery
    }

    case 'count': {
      const [
        tableName,
        searchExpression,
      ] = args as MakeSqlQueryMethodTargetParameters<'count'>

      const searchExpr = searchToWhereExpression(
        searchExpression,
        escapeId,
        escapeStr,
        makeNestedPath,
        splitNestedPath
      )

      const inlineSearchExpr =
        searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

      const sqlQuery = `SELECT Count(*) AS ${escapeId('Count')}
      FROM ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)}
      ${inlineSearchExpr};`

      return sqlQuery
    }

    case 'insert': {
      const [
        tableName,
        document,
      ] = args as MakeSqlQueryMethodTargetParameters<'insert'>

      const sqlQuery = `INSERT INTO ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}(${Object.keys(document)
        .map((key) => escapeId(key))
        .join(', ')})
        VALUES(${Object.keys(document)
          .map(
            (key) =>
              `CAST(${escapeStr(JSON.stringify(document[key]))} AS JSONB)`
          )
          .join(', ')});
      `

      return sqlQuery
    }
    case 'update': {
      const [
        tableName,
        searchExpression,
        updateExpression,
        options,
      ] = args as MakeSqlQueryMethodTargetParameters<'update'>
      const isUpsert = options != null ? !!options.upsert : false
      const upsertDocument = isUpsert
        ? buildUpsertDocument(
            searchExpression,
            updateExpression,
            splitNestedPath
          )
        : null

      const searchExpr = searchToWhereExpression(
        searchExpression,
        escapeId,
        escapeStr,
        makeNestedPath,
        splitNestedPath
      )
      const updateExpr = updateToSetExpression(
        updateExpression,
        escapeId,
        escapeStr,
        makeNestedPath,
        splitNestedPath
      )

      const inlineSearchExpr =
        searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

      const baseQuery = `UPDATE ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}
      SET ${updateExpr} ${inlineSearchExpr}`

      const upsertKeys =
        upsertDocument != null ? Object.keys(upsertDocument) : null

      const sqlQuery =
        updateExpr.trim() !== ''
          ? upsertDocument != null &&
            upsertKeys != null &&
            upsertKeys.length > 0
            ? `WITH "Updating" AS (
          ${baseQuery} RETURNING *
        ), "Inserting" AS (
          SELECT ${upsertKeys
            .map(
              (key) =>
                `CAST(${escapeStr(
                  JSON.stringify(upsertDocument[key])
                )} AS JSONB) AS ${escapeId(key)}`
            )
            .join(', ')}
          WHERE NOT EXISTS(SELECT * FROM "Updating")
        )
        INSERT INTO ${escapeId(schemaName)}.${escapeId(
                `${tablePrefix}${tableName}`
              )}(${upsertKeys.map((key) => escapeId(key)).join(', ')})
        SELECT * FROM "Inserting"
        ON CONFLICT DO NOTHING
        ;`
            : baseQuery
          : ''

      return sqlQuery
    }

    case 'delete': {
      const [
        tableName,
        searchExpression,
      ] = args as MakeSqlQueryMethodTargetParameters<'delete'>

      const searchExpr = searchToWhereExpression(
        searchExpression,
        escapeId,
        escapeStr,
        makeNestedPath,
        splitNestedPath
      )

      const inlineSearchExpr =
        searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

      const sqlQuery = `DELETE FROM ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}
      ${inlineSearchExpr};`

      return sqlQuery
    }
    default: {
      throw new Error(`Invalid operation ${operation}`)
    }
  }
}

export default makeSqlQuery
