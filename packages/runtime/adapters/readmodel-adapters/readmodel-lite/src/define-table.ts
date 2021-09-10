import type { CurrentStoreApi } from './types'

const defineTable: CurrentStoreApi['defineTable'] = async (
  { inlineLedgerRunQuery, tablePrefix, escapeId },
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

  await inlineLedgerRunQuery(
    `CREATE TABLE ${escapeId(`${tablePrefix}${tableName}`)} (
    -- RESOLVE READ-MODEL ${escapeId(`${readModelName}`)} OWNED TABLE
      ${tableDescription.fields
        .concat(Object.keys(tableDescription.indexes))
        .map((columnName) => `${escapeId(columnName)} JSON`)
        .join(',\n')}
    )`,
    true
  )

  for (const [idx, indexName] of Object.entries(
    Object.keys(tableDescription.indexes)
  )) {
    const indexType = tableDescription.indexes[indexName]
    if (indexType !== 'string' && indexType !== 'number') {
      throw new Error(
        `Wrong index "${indexName}" type "${tableDescription.indexes[indexName]}"`
      )
    }

    const baseIndexName = (postfix: string): string =>
      escapeId(`${tablePrefix}${tableName}-${indexName}-${postfix}`)

    const indexCategory = +idx === 0 ? 'UNIQUE' : ''

    await inlineLedgerRunQuery(
      `CREATE ${indexCategory} INDEX ${baseIndexName('type-validation')}
        ON ${escapeId(`${tablePrefix}${tableName}`)}(
          CAST(json_extract(${escapeId(indexName)}, '$') AS ${
        indexType === 'number' ? 'NUMERIC' : 'TEXT'
      })
        )`,
      true
    )

    await inlineLedgerRunQuery(
      `CREATE ${indexCategory} INDEX ${baseIndexName('extracted-field')}
        ON ${escapeId(`${tablePrefix}${tableName}`)}(
          json_extract(${escapeId(indexName)}, '$')
        )`,
      true
    )

    await inlineLedgerRunQuery(
      `CREATE ${indexCategory} INDEX ${baseIndexName('full-field')}
        ON ${escapeId(`${tablePrefix}${tableName}`)}(
          ${escapeId(indexName)}
        )`,
      true
    )
  }
}

export default defineTable
