import createReadModelConnector, {
  AdapterImplementation,
  CommonAdapterPool,
  CommonAdapterOptions,
  AlreadyDisposedError,
} from '../src'

jest.mock('../src/make-split-nested-path', () => jest.fn())

test('@resolve-js/readmodel-base should wrap descendant adapter', async () => {
  const implementation: AdapterImplementation<
    CommonAdapterPool,
    CommonAdapterOptions & { parameter: string }
  > = {
    connect: jest.fn().mockImplementation(async () => void 0),
    disconnect: jest.fn().mockImplementation(async () => void 0),
    subscribe: jest.fn().mockImplementation(async () => void 0),
    unsubscribe: jest.fn().mockImplementation(async () => void 0),
    resubscribe: jest.fn().mockImplementation(async () => void 0),
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

  const loadProcedureSource = async () => null

  const eventstoreAdapter = {
    loadEvents: jest.fn().mockResolvedValue({ cursor: 'CURSOR', events: [] }),
    getNextCursor: jest.fn().mockReturnValue('CURSOR'),
    getSecretsManager: jest.fn().mockReturnValue({
      getSecret: async (id: string): Promise<string | null> => {
        return ''
      },
      setSecret: async (id: string, secret: string): Promise<void> => {
        return
      },
      deleteSecret: async (id: string): Promise<boolean> => {
        return true
      },
    }),
    gatherSecretsFromEvents: jest.fn().mockReturnValue({
      existingSecrets: [],
      deletedSecrets: [],
    }),
  } as any

  const adapterOptions = {
    parameter: 'content',
  } as const

  const adapter = createReadModelConnector(implementation, adapterOptions)

  const getVacantTimeInMillis = jest.fn().mockReturnValue(15000)

  const modelInterop: Parameters<typeof adapter.build>[3] = {
    name: 'test',
    connectorName: 'test',
    acquireResolver: async () => async () => void 0,
    acquireInitHandler: async (
      store: Parameters<
        Parameters<typeof adapter.build>[3]['acquireInitHandler']
      >[0]
    ) => async () => {
      await store.defineTable('TableName', {
        indexes: { id: 'number' },
        fields: [],
      })
    },
    acquireEventHandler: async (
      store: Parameters<
        Parameters<typeof adapter.build>[3]['acquireEventHandler']
      >[0],
      event: Parameters<
        Parameters<typeof adapter.build>[3]['acquireEventHandler']
      >[1]
    ) => async () => {
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
      void event
    },
  }

  const readModelName = 'ReadModelName'
  const store = await adapter.connect(readModelName)
  const adapterPool = (implementation.connect as any).mock.calls[0][0]
  expect(implementation.connect).toBeCalledWith(adapterPool, adapterOptions)

  await adapter.subscribe(store, readModelName, null, null, loadProcedureSource)

  expect(implementation.subscribe).toBeCalledWith(
    adapterPool,
    readModelName,
    null,
    null,
    loadProcedureSource
  )

  const buildInfo = {
    initiator: 'read-model-next',
    notificationId: '0',
    sendTime: 0,
  } as const

  const buildStep = jest.fn().mockImplementation(async () => {
    await new Promise((resolve) => setImmediate(resolve))
    await adapter.build(
      store,
      readModelName,
      store,
      modelInterop,
      buildStep,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )
  })
  await buildStep()
  expect(implementation.build).toBeCalledWith(
    adapterPool,
    readModelName,
    store,
    modelInterop,
    buildStep,
    eventstoreAdapter,
    getVacantTimeInMillis,
    buildInfo
  )

  let handler = await modelInterop.acquireInitHandler(store)
  if (handler == null) {
    throw Error('no init handler')
  }
  await handler()
  expect(implementation.defineTable).toBeCalledWith(
    adapterPool,
    readModelName,
    'TableName',
    { indexes: { id: 'number' }, fields: [] }
  )

  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  handler = await modelInterop.acquireEventHandler(store, null! as any)
  if (handler == null) {
    throw Error('no event handler')
  }
  await handler()
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

  await adapter.resubscribe(
    store,
    readModelName,
    null,
    null,
    loadProcedureSource
  )
  expect(implementation.resubscribe).toBeCalledWith(
    adapterPool,
    readModelName,
    null,
    null,
    loadProcedureSource
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

  await adapter.status(store, readModelName, eventstoreAdapter)

  expect(implementation.status).toBeCalledWith(
    adapterPool,
    readModelName,
    eventstoreAdapter
  )

  await adapter.unsubscribe(store, readModelName, loadProcedureSource)
  expect(implementation.unsubscribe).toBeCalledWith(
    adapterPool,
    readModelName,
    loadProcedureSource
  )

  await adapter.disconnect(store)
  expect(implementation.disconnect).toBeCalledWith(adapterPool)

  try {
    await adapter.disconnect(store)
  } catch (error) {
    expect(error).toBeInstanceOf(AlreadyDisposedError)
    expect(AlreadyDisposedError.is(error)).toEqual(true)
  }
})
