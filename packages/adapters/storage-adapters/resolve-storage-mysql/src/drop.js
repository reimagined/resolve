const drop = async ({ tableName, connection, escapeId }) => {
  await connection.execute(`
    DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}
  `)

  await connection.execute(`
    DROP TABLE ${escapeId(tableName)}
  `)
}

export default drop
