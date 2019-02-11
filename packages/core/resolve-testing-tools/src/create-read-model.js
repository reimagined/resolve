const createReadModel = (
  {
    createQuery,
    createStorageAdapter,
    createBusAdapter,
    createEventStore,
    createReadModelAdapter,
    createResolver,
    createResolvers,
    applyEvent,
    applyEvents
  },
  { name, projection, resolvers, adapter }
) => {
  const storage = createStorageAdapter()
  const bus = createBusAdapter()

  const eventStore = createEventStore({ storage, bus })
  const adapterName = 'default'

  const query = createQuery({
    eventStore,
    viewModels: [],
    readModelAdapters: {
      [adapterName]: adapter != null ? adapter : createReadModelAdapter()
    },
    readModels: [
      {
        name,
        adapterName,
        projection,
        resolvers
      }
    ]
  })

  const pool = {
    applyEvent,
    applyEvents,
    createResolver,
    modelName: name,
    projection,
    resolvers,
    storage,
    bus,
    query,
    timestamp: 1
  }

  return Object.freeze({
    resolvers: createResolvers(pool),
    applyEvent: applyEvent.bind(null, pool),
    applyEvents: applyEvents.bind(null, pool),
    dispose: query.dispose
  })
}

export default createReadModel
