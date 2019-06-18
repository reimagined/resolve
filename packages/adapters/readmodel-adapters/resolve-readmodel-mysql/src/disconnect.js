const disconnect = async pool => {
  pool.isDisconnected = true
  const connection = await pool.connectionPromise
  if (connection == null) {
    return
  }
  await connection.end()
  pool.connectionPromise = null
}

export default disconnect
