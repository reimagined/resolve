const drop = async ({ database, tableName, escapeId }) => {
  await database.exec(`DELETE FROM ${escapeId(tableName)}`)
}

export default drop
