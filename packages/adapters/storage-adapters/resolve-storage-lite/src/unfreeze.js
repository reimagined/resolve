const unfreeze = async ({ database, tableName, escapeId }) => {
  await database.exec(`DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}`)
}

export default unfreeze
