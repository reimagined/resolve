const createAndInitPublisher = async (
  { imports, functions, broker, lifecycle },
  activeConfig
) => {
  const { connectConsumer, ...config } = activeConfig

  const pool = {
    ...imports,
    ...functions,
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
    read: broker.read.bind(null, pool),
    init: broker.init.bind(null, pool),
    drop: broker.drop.bind(null, pool),
    dispose: pool.database.dispose
  }

  const api = await functions.createServer({
    hostObject: server,
    address: config.publisherAddress
  })

  return api
}

export default createAndInitPublisher
