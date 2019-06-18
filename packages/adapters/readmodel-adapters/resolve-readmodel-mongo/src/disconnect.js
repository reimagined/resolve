const disconnect = async pool => {
  pool.isDisconnected = true
  const connection = await pool.databasePromise
  if (connection == null) {
    return
  }
  await connection.close()
  pool.databasePromise = null
}

export default disconnect
