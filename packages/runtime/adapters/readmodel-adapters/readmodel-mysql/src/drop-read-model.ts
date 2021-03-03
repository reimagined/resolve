import type { DropReadModelMethod } from './types'

const dropReadModel: DropReadModelMethod = async (
  { inlineLedgerRunQuery, escapeId },
  readModelName
) => {
  const rows = (await inlineLedgerRunQuery(
    `SELECT table_name AS \`tableName\` FROM INFORMATION_SCHEMA.TABLES
    WHERE table_comment LIKE "RESOLVE-${readModelName}"
    AND table_schema=DATABASE();`
  )) as Array<{ tableName: string }>

  for (const { tableName } of rows) {
    await inlineLedgerRunQuery(`DROP TABLE ${escapeId(tableName)};`)
  }
}

export default dropReadModel
