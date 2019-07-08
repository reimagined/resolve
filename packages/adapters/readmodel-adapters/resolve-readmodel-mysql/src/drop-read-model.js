const dropReadModel = async ({ runQuery, escapeId }, readModelName) => {
  const rows = await runQuery(
    `SELECT table_name AS \`tableName\` FROM INFORMATION_SCHEMA.TABLES
    WHERE table_comment LIKE "RESOLVE-${readModelName}"
    AND table_schema=DATABASE();`
  )

  for (const { tableName } of rows) {
    await runQuery(`DROP TABLE ${escapeId(tableName)};`)
  }
}

export default dropReadModel
