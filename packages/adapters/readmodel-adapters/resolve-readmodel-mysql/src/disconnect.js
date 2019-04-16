const disconnect = async pool => {
  const connection = await pool.connectionPromise
  await connection.end()
}

export default disconnect
