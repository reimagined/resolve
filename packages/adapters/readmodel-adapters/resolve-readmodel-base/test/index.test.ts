import createReadModelConnector, {
  AdapterImplementation,
  CommonAdapterPool,
  CommonAdapterOptions,
} from '../src/index'

test('resolve-readmodel-base should wrap descendant adapter', async () => {
  const implementation: AdapterImplementation<
    CommonAdapterPool,
    CommonAdapterOptions & { parameter: string }
  > = {
    connect: jest.fn().mockImplementation(async () => void 0),
    disconnect: jest.fn().mockImplementation(async () => void 0),
    subscribe: jest.fn().mockImplementation(async () => void 0),
    unsubscribe: jest.fn().mockImplementation(async () => void 0),
    resubscribe: jest.fn().mockImplementation(async () => void 0),
    deleteProperty: jest.fn().mockImplementation(async () => void 0),
    getProperty: jest.fn().mockImplementation(async () => `Value`),
    listProperties: jest
      .fn()
      .mockImplementation(async () => ({ Key: `Value` })),
    setProperty: jest.fn().mockImplementation(async () => void 0),
    resume: jest.fn().mockImplementation(async () => void 0),
    pause: jest.fn().mockImplementation(async () => void 0),
    reset: jest.fn().mockImplementation(async () => void 0),
    status: jest.fn().mockImplementation(async () => ({} as any)),
    build: jest.fn().mockImplementation(async () => void 0),
    defineTable: jest.fn().mockImplementation(async () => void 0),
    findOne: jest.fn().mockImplementation(async () => ({})),
    find: jest.fn().mockImplementation(async () => [{}]),
    count: jest.fn().mockImplementation(async () => 0),
    insert: jest.fn().mockImplementation(async () => void 0),
    update: jest.fn().mockImplementation(async () => void 0),
    delete: jest.fn().mockImplementation(async () => void 0),
  }

  const adapterPool = { performanceTracer: undefined }
  const eventstoreAdapter = {
    loadEvents: jest.fn().mockResolvedValue({ cursor: 'CURSOR', events: [] }),
    getNextCursor: jest.fn().mockReturnValue('CURSOR'),
  }

  const adapterOptions = {
    parameter: 'content',
  }

  const adapter = createReadModelConnector(implementation, {
    ...adapterPool,
    ...adapterOptions,
  })

  const getVacantTimeInMillis = jest.fn().mockReturnValue(15000)
  const provideLedger = jest.fn()
  const getEncryption = jest.fn()

  const projection: Parameters<typeof adapter.build>[3] = {
    async Init(store) {
      await store.defineTable('TableName', {
        indexes: { id: 'number' },
        fields: [],
      })
    },
    async EventType(store, event) {
      await store.count('TableName', { key: 'value' })
      await store.findOne('TableName', { key: 'value' })
      await store.find('TableName', { key: 'value' })
      await store.insert('TableName', { key: 'value' })
      await store.update(
        'TableName',
        { key: 'value' },
        { $set: { key: 'value' } }
      )
      await store.delete('TableName', { key: 'value' })
    },
  }

  const readModelName = 'ReadModelName'
  const store = await adapter.connect(readModelName)
  expect(implementation.connect).toBeCalledWith(adapterPool, adapterOptions)

  await adapter.subscribe(store, readModelName, null, null)
  expect(implementation.subscribe).toBeCalledWith(
    adapterPool,
    readModelName,
    null,
    null
  )

  const buildStep = jest.fn().mockImplementation(async () => {
    await new Promise((resolve) => setImmediate(resolve))
    await adapter.build(
      store,
      readModelName,
      store,
      projection,
      buildStep,
      eventstoreAdapter,
      getVacantTimeInMillis,
      provideLedger,
      getEncryption
    )
  })
  await buildStep()
  expect(implementation.build).toBeCalledWith(
    adapterPool,
    readModelName,
    store,
    projection,
    buildStep,
    eventstoreAdapter,
    getVacantTimeInMillis,
    provideLedger,
    getEncryption
  )

  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await projection.Init(store, null! as any)
  expect(implementation.defineTable).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { indexes: { id: 'number' }, fields: [] }
  )

  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await projection.EventType(store, null! as any)
  expect(implementation.count).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { key: 'value' }
  )
  expect(implementation.findOne).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { key: 'value' }
  )
  expect(implementation.find).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { key: 'value' }
  )
  expect(implementation.insert).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { key: 'value' }
  )
  expect(implementation.update).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { key: 'value' },
    { $set: { key: 'value' } }
  )
  expect(implementation.delete).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { key: 'value' }
  )

  await adapter.resubscribe(store, readModelName, null, null)
  expect(implementation.resubscribe).toBeCalledWith(
    adapterPool,
    readModelName,
    null,
    null
  )

  await adapter.resume(store, readModelName, buildStep)
  expect(implementation.resume).toBeCalledWith(
    adapterPool,
    readModelName,
    buildStep
  )

  await adapter.pause(store, readModelName)
  expect(implementation.pause).toBeCalledWith(adapterPool, readModelName)

  await adapter.reset(store, readModelName)
  expect(implementation.reset).toBeCalledWith(adapterPool, readModelName)

  await adapter.status(store, readModelName)
  expect(implementation.status).toBeCalledWith(adapterPool, readModelName)

  await adapter.deleteProperty(store, readModelName, 'key')
  expect(implementation.deleteProperty).toBeCalledWith(
    adapterPool,
    readModelName,
    'key'
  )

  await adapter.getProperty(store, readModelName, 'key')
  expect(implementation.getProperty).toBeCalledWith(
    adapterPool,
    readModelName,
    'key'
  )

  await adapter.setProperty(store, readModelName, 'key', 'value')
  expect(implementation.setProperty).toBeCalledWith(
    adapterPool,
    readModelName,
    'key',
    'value'
  )

  await adapter.listProperties(store, readModelName)
  expect(implementation.listProperties).toBeCalledWith(
    adapterPool,
    readModelName
  )

  await adapter.unsubscribe(store, readModelName)
  expect(implementation.unsubscribe).toBeCalledWith(adapterPool, readModelName)

  await adapter.disconnect(store)
  expect(implementation.disconnect).toBeCalledWith(adapterPool)
})