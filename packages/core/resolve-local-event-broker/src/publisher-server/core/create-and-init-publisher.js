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
    read: broker.read.bind(null, pool),
    init: lifecycle.createDatabase.bind(null, pool),
    drop: lifecycle.dropDatabase.bind(null, pool),
    dispose: pool.database.dispose,

    // TODO restore
    listProperties: async eventSubscriber => {
      void eventSubscriber
      return []
    },
    getProperty: async (eventSubscriber, key) => {
      void (eventSubscriber, key)
      return null
    },
    setProperty: async (eventSubscriber, key, value) => {
      void (eventSubscriber, key, value)
    },
    deleteProperty: async (eventSubscriber, key) => {
      void (eventSubscriber, key)
    }
  }

  const api = await functions.createServer({
    hostObject: server,
    address: config.publisherAddress
  })

  return api
}

export default createAndInitPublisher
