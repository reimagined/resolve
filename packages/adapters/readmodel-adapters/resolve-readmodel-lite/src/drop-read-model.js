const dropReadModel = async (
  { runQuery, escapeId, escape, memoryStore },
  readModelName
) => {
  const rows = await runQuery(
    `SELECT name FROM sqlite_master WHERE type=${escape('table')}
    AND sql LIKE ${escape(
      `%-- RESOLVE READ-MODEL ${escapeId(`${readModelName}`)} OWNED TABLE%`
    )}
    AND name NOT LIKE ${escape('sqlite_%')}`
  )

  for (const { name } of rows) {
    await runQuery(`DROP TABLE ${escapeId(name)}`)
  }

  if (memoryStore.drop != null) {
    try {
      await memoryStore.drop()
    } catch (e) {}
  }
}

export default dropReadModel
