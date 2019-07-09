const createAndInitBroker = async (imports, config) => {
  const pool = { ...imports, config, eventStore: config.eventStore }

  if (
    !pool.checkOptionShape(pool.config, [Object]) ||
    !pool.checkOptionShape(pool.config.zmqBrokerAddress, [String]) ||
    !pool.checkOptionShape(pool.config.zmqConsumerAddress, [String]) ||
    !pool.checkOptionShape(pool.config.databaseFile, [String]) ||
    !pool.checkOptionShape(pool.config.batchSize, [Number]) ||
    !pool.checkOptionShape(pool.config.initialTimestamp, [Number], true) ||
    !pool.checkOptionShape(pool.config.eventStore, [Object])
  ) {
    throw new Error(`
      Local event broker configuration is malformed.
      Config should be following be following object shape: {
        zmqBrokerAddress: "broker-ip-address:port",
        zmqConsumerAddress: "consumer-ip-address:port",
        databaseFile: "path/to/database",
        eventStore: <reSolve eventstore>
      }
    `)
  }

  pool.initialTimestamp =
    pool.config.initialTimestamp != null
      ? pool.config.initialTimestamp
      : Date.now()

  await pool.initDatabase(pool)
  await pool.initSockets(pool)

  return pool.dispose.bind(null, pool)
}

export default createAndInitBroker
