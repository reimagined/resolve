import sinon from 'sinon'

import createReadModel from '../src/create-read-model'

// eslint-disable-next-line max-len
test('method "createReadModel" should create read model { resolvers, applyEvent, applyEvents, dispose }', async () => {
  const event1 = { type: 'SOME_TYPE_1' }
  const event2 = { type: 'SOME_TYPE_2' }
  const storage = {
    /* storage */
  }
  const bus = {
    /* bus */
  }
  const eventStore = {
    /* eventStore */
  }
  const query = { /* query */ dispose: sinon.stub() }

  const name = 'name'
  const projection = { Init: () => {} }
  const resolvers = { test: async () => 42 }
  const adapter = {
    /* adapter */
  }

  const createQuery = sinon.stub().returns(query)
  const createStorageAdapter = sinon.stub().returns(storage)
  const createBusAdapter = sinon.stub().returns(bus)
  const createEventStore = sinon.stub().returns(eventStore)
  const createReadModelAdapter = sinon.stub().returns(adapter)
  const createResolver = sinon.stub()
  const createResolvers = sinon.stub().returns(resolvers)
  const applyEvent = sinon.stub()
  const applyEvents = sinon.stub()

  const readModel = createReadModel(
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
  )

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

  expect(await readModel.resolvers.test()).toEqual(42)

  readModel.applyEvent(event1)
  sinon.assert.calledWith(applyEvent, pool, event1)

  readModel.applyEvents([event1, event2])
  sinon.assert.calledWith(applyEvents, pool, [event1, event2])

  readModel.dispose()
  sinon.assert.calledWith(query.dispose)
})
