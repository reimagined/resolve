const activate = async ({ connection, tableName, escapeId }) => {
  await connection.execute(
    `DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}`
  )
}

export default activate
