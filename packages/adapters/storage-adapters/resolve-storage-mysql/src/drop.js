const drop = async ({ tableName, connection, escapeId }) => {
  await connection.execute(`
    DELETE FROM ${escapeId(tableName)}
  `)
}

export default drop
