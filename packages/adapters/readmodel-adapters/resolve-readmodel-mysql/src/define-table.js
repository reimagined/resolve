const STRING_INDEX_TYPE =
  'VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
const NUMBER_INDEX_TYPE = 'BIGINT'

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
    `CREATE TABLE ${escapeId(`${tablePrefix}${tableName}`)} (` +
      [
        ...tableDescription.fields.map(
          columnName => `${escapeId(columnName)} JSON`
        ),
        ...Object.keys(tableDescription.indexes).map((indexName, idx) => {
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
                `Wrong index "${indexName}" type "${tableDescription.indexes[indexName]}"`
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
        }),
        ...Object.keys(tableDescription.indexes).map(
          indexName =>
            `INDEX ${escapeId(`${indexName}\u0004\u0004`)} (${escapeId(
              `${indexName}\u0004`
            )})`
        )
      ].join(',\n') +
      `)
      COMMENT = "RESOLVE-${readModelName}"
      ENGINE = "InnoDB";
      `
  )
}

export default defineTable
