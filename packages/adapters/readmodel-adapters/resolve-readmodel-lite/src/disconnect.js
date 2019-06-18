const disconnect = async pool => {
  if (pool.memoryConnection == null) {
    await pool.connection.close()
  }
}

export default disconnect
