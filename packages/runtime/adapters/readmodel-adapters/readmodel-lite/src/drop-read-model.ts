import type { DropReadModelMethod } from './types'

const dropReadModel: DropReadModelMethod = async (
  { inlineLedgerRunQuery, escapeId, escapeStr, memoryStore },
  readModelName
) => {
  const rows = await inlineLedgerRunQuery(
    `SELECT name FROM sqlite_master WHERE type=${escapeStr('table')}
    AND sql LIKE ${escapeStr(
      `%-- RESOLVE READ-MODEL ${escapeId(`${readModelName}`)} OWNED TABLE%`
    )}
    AND name NOT LIKE ${escapeStr('sqlite_%')}`
  )

  for (const { name } of rows as Array<{ name: string }>) {
    await inlineLedgerRunQuery(`DROP TABLE ${escapeId(name)}`, true)
  }

  if (memoryStore.drop != null) {
    try {
      await memoryStore.drop()
    } catch (e) {}
  }
}

export default dropReadModel
