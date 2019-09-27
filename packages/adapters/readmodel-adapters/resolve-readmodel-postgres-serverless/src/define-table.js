const STRING_INDEX_TYPE = 'VARCHAR(190)'
const NUMBER_INDEX_TYPE = 'BIGINT'

const defineTable = async (
  { executeStatement, tablePrefix, escapeId, escape, schemaName },
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
  const { fields, indexes } = tableDescription

  await executeStatement(`
    CREATE TABLE ${escapeId(schemaName)}.${escapeId(
    `${tablePrefix}${tableName}`
  )} (
      ${fields
        .concat(Object.keys(indexes))
        .map(columnName => `${escapeId(columnName)} JSONB`)
        .join(', ')}
    );

    ${Object.entries(indexes).map(
      ([indexName, indexType], idx) => `
      ALTER TABLE ${escapeId(schemaName)}.${escapeId(
        `${tablePrefix}${tableName}`
      )}
      ADD CONSTRAINT ${escapeId(`${indexName}-type-validation`)}
      CHECK (jsonb_typeof(${escapeId(indexName)}) = ${escape(
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
    )}

    COMMENT ON TABLE ${escapeId(schemaName)}.${escapeId(
    `${tablePrefix}${tableName}`
  )}
    IS ${escape(`RESOLVE-${readModelName}`)};
  `)
}

export default defineTable
