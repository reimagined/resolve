const unfreeze = async ({ database, eventsTableName, escapeId }) => {
  await database.exec(`DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`)
}

export default unfreeze
