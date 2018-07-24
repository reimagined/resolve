describe('Read-model generic adapter API', () => {
  const createReadModel = require('resolve-query').createReadModel
  const createAdapter = require('resolve-readmodel-memory').default

  let buildTestReadModel, events

  it('Insert and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  it('Update and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    events.push({ type: 'UPDATE_TEST', timestamp: 101 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  it('Upsert and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    events.push({ type: 'UPSERT_TEST', timestamp: 101 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  it('Delete and find in table', async () => {
    events.push({ type: 'INSERT_TEST', timestamp: 100 })
    events.push({ type: 'DELETE_TEST', timestamp: 101 })
    const reader = buildTestReadModelReader()

    const result = await reader('RESOLVER_TEST', { x: 1, y: 2 })
    expect(result).toMatchSnapshot()
  })

  beforeEach(async () => {
    events = []
    const eventStore = {
      async subscribeByEventType(eventTypes, handler, { startTime = 0 } = {}) {
        for (let event of events) {
          if (event && eventTypes.indexOf(event.type) > -1 && event.timestamp >= startTime) {
            handler(event)
            await Promise.resolve()
          }
        }

        return () => null
      }
    }

    buildTestReadModelReader = () => {
      const readModel = createReadModel({
        adapter: createAdapter(),
        projection,
        eventStore,
        resolvers
      })

      return async (resolverName, resolverArgs) => {
        let result = await readModel.read(resolverName, resolverArgs)
        const lastError = await readModel.getLastError()

        if (lastError != null) {
          result = lastError
        }

        return result
      }
    }
  })

  afterEach(async () => {
    buildTestReadModel = null
    events = null
  })
})
