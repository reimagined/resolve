const disconnect = async (pool) => {
  await pool.connection.end()
}

export default disconnect
