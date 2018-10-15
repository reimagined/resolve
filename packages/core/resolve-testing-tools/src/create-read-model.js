const createReadModel = (
  createQuery,
  createStorageAdapter,
  createBusAdapter,
  createEventStore,
  createReadModelAdapter,
  createResolver,
  createResolvers,
  applyEvent,
  applyEvents,
  { name, projection, resolvers, adapter = createReadModelAdapter }
) => {
  const storage = createStorageAdapter()
  const bus = createBusAdapter()

  const eventStore = createEventStore({ storage, bus })

  const query = createQuery({
    eventStore,
    viewModels: [],
    readModels: [
      {
        name,
        projection,
        resolvers,
        adapter
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
    adapter,
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
