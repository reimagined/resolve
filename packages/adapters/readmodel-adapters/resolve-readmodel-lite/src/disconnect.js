const disconnect = async pool => {
  await pool.connection.close()
}

export default disconnect
