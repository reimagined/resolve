const dispose = async pool => {
  pool.xpubSocket.unbindSync(pool.config.zmqBrokerAddress)
  pool.subSocket.unbindSync(pool.config.zmqConsumerAddress)
  pool.clientMap.clear()

  await Promise.all([pool.eventStore.dispose(), pool.meta.dispose()])
}

export default dispose
