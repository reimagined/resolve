import type { DropReadModelMethod } from './types'

const dropReadModel: DropReadModelMethod = async (
  { runQuery, escapeId, escapeStr, memoryStore },
  readModelName
) => {
  const rows = await runQuery(
    `SELECT name FROM sqlite_master WHERE type=${escapeStr('table')}
    AND sql LIKE ${escapeStr(
      `%-- RESOLVE READ-MODEL ${escapeId(`${readModelName}`)} OWNED TABLE%`
    )}
    AND name NOT LIKE ${escapeStr('sqlite_%')}`
  )

  for (const { name } of rows as Array<{ name: string }>) {
    await runQuery(`DROP TABLE ${escapeId(name)}`)
  }

  if (memoryStore.drop != null) {
    try {
      await memoryStore.drop()
    } catch (e) {}
  }
}

export default dropReadModel
