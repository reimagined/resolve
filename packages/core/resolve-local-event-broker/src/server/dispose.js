const dispose = async pool => {
  await pool.xpubSocket.unbind(pool.config.zmqBrokerAddress)
  await pool.subSocket.unbind(pool.config.zmqConsumerAddress)
  pool.clientMap.clear()
  const disposePromises = [pool.eventStore.dispose(), pool.database.close()]
  await Promise.all(disposePromises)
}

export default dispose
