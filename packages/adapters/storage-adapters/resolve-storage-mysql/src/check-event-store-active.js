const checkEventStoreActive = async pool => {
  const { connection, tableName, escapeId } = pool

  const [rows] = await connection.query(
    `SHOW TABLES LIKE ${escapeId(`${tableName}-freeze`)}`
  )

  return rows.length === 0
}

export default checkEventStoreActive
