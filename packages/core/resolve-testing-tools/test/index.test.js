import sinon from 'sinon'

describe('resolve-testing-tools index', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should call createReadModel with correct arguments', () => {
    const createQuery = require('resolve-query')
    const createStorageAdapter = require('resolve-storage-lite')
    const createBusAdapter = require('resolve-bus-memory')
    const createEventStore = require('resolve-es')
    const createReadModelAdapter = require('resolve-readmodel-memory')
    const createReadModelFactory = require('../src/create-read-model')
    const applyEvent = require('../src/apply-event')
    const applyEvents = require('../src/apply-events')
    const createResolver = require('../src/create-resolver')
    const createResolvers = require('../src/create-resolvers')

    sandbox.stub(createQuery, 'default')
    sandbox.stub(createStorageAdapter, 'default')
    sandbox.stub(createBusAdapter, 'default')
    sandbox.stub(createEventStore, 'default')
    sandbox.stub(createReadModelAdapter, 'default')
    sandbox.stub(createReadModelFactory, 'default')
    sandbox.stub(applyEvent, 'default')
    sandbox.stub(applyEvents, 'default')
    sandbox.stub(createResolver, 'default')
    sandbox.stub(createResolvers, 'default')

    const { createReadModel } = require('../src/index.js')

    createReadModel()

    sinon.assert.calledWith(createReadModelFactory.default, {
      createQuery: createQuery.default,
      createStorageAdapter: createStorageAdapter.default,
      createBusAdapter: createBusAdapter.default,
      createEventStore: createEventStore.default,
      createReadModelAdapter: createReadModelAdapter.default,
      createResolver: createResolver.default,
      createResolvers: createResolvers.default,
      applyEvent: applyEvent.default,
      applyEvents: applyEvents.default
    })
  })
})
