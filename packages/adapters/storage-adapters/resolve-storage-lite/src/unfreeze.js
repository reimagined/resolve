const unfreeze = async ({ database, tableName, escapeId }) => {
  await database.exec(`DROP TABLE ${escapeId(`${tableName}-freeze`)}`)
}

export default unfreeze
