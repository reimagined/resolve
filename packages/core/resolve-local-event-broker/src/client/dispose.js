const dispose = async pool => {
  if (pool.isDisposed) {
    throw new Error('Client broker is already disposed')
  }

  pool.isDisposed = true
  await pool.subSocket.close()
  await pool.pubSocket.close()

  for (const key of Object.keys(pool)) {
    delete pool[key]
  }

  pool.isDisposed = true
}

export default dispose
