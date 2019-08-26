const activateEventStore = async ({ connection, tableName, escapeId }) => {
  await connection.execute(`DROP TABLE ${escapeId(`${tableName}-freeze`)}`)
}

export default activateEventStore
