const drop = async ({ database, tableName, escapeId }) => {
  await database.exec(`DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}`)
  await database.exec(`DROP TABLE IF EXISTS ${escapeId(tableName)}`)
}

export default drop
