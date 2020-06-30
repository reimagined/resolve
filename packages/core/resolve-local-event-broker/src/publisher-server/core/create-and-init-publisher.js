const createAndInitPublisher = async (
  { imports, functions, broker, lifecycle },
  activeConfig
) => {
  const { connectConsumer, ...config } = activeConfig

  const pool = {
    ...imports,
    ...functions,
    ...broker,
    ...lifecycle,
    database: await functions.connectDatabase(imports, {
      databaseFile: config.databaseFile
    }),
    consumer: await connectConsumer({
      address: config.consumerAddress
    })
  }

  const server = {
    subscribe: broker.subscribe.bind(null, pool),
    unsubscribe: broker.unsubscribe.bind(null, pool),
    resubscribe: broker.resubscribe.bind(null, pool),
    acknowledge: broker.acknowledge.bind(null, pool),
    publish: broker.publish.bind(null, pool),
    status: broker.status.bind(null, pool),
    resume: broker.resume.bind(null, pool),
    pause: broker.pause.bind(null, pool),
    reset: broker.reset.bind(null, pool),
    listProperties: broker.interopProperty.bind(null, pool, 'listProperties'),
    getProperty: broker.interopProperty.bind(null, pool, 'getProperty'),
    setProperty: broker.interopProperty.bind(null, pool, 'setProperty'),
    deleteProperty: broker.interopProperty.bind(null, pool, 'deleteProperty'),
    read: broker.read.bind(null, pool),
    init: lifecycle.createDatabase.bind(null, pool),
    drop: lifecycle.dropDatabase.bind(null, pool),
    dispose: pool.database.dispose
  }

  const api = await functions.createServer({
    hostObject: server,
    address: config.publisherAddress
  })

  return api
}

export default createAndInitPublisher
