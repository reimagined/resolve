const drop = async ({ database, tableName, escapeId, memoryStore }) => {
  await database.exec(`DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}`)
  await database.exec(`DROP TABLE ${escapeId(tableName)}`)
  if (memoryStore != null) {
    try {
      await memoryStore.drop()
    } catch (e) {}
  }
}

export default drop
