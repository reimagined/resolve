const dispose = async pool => {
  pool.xpubSocket.unbindSync(pool.config.zmqBrokerAddress)
  pool.subSocket.unbindSync(pool.config.zmqConsumerAddress)
  pool.clientMap.clear()
  const disposePromises = [pool.eventStore.dispose(), pool.database.close()]
  await Promise.all(disposePromises)
}

export default dispose
