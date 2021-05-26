import type { CurrentStoreApi } from './types'

const STRING_INDEX_TYPE = 'VARCHAR(190)'
const NUMBER_INDEX_TYPE = 'BIGINT'

const defineTable: CurrentStoreApi['defineTable'] = async (
  pool,
  readModelName,
  tableName,
  tableDescription
) => {
  const {
    inlineLedgerExecuteStatement,
    tablePrefix,
    escapeId,
    escapeStr,
    schemaName,
  } = pool
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

  await inlineLedgerExecuteStatement(
    pool,
    `
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
  `,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default defineTable
