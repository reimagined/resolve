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
        `Wrong index "${indexName}" type "${tableDescription.indexes[indexName]}"`
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

export default defineTable
