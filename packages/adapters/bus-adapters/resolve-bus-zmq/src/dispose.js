const dispose = async pool => {
  const { subAddress, pubAddress } = pool.config
  pool.disposed = true
  pool.handlers.clear()

  if (pool.xpubSocket) {
    pool.xpubSocket.unbindSync(pubAddress)
  }

  if (pool.xsubSocket) {
    pool.xsubSocket.unbindSync(subAddress)
  }

  pool.subSocket.disconnect(pubAddress)
  pool.pubSocket.disconnect(subAddress)
}

export default dispose
