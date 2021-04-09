import { SecretsManager } from '../src/types/core'
import { getReadModelsInteropBuilder } from '../src/read-model/get-read-models-interop-builder'
import { ReadModelInterop, ReadModelRuntime } from '../src/read-model/types'
import { ReadModelMeta, Monitoring } from '../src/types/runtime'

const dummyEncryption = () => Promise.resolve({})

const makeReadModelMeta = (params: any): ReadModelMeta[] => [
  {
    encryption: params.encryption || dummyEncryption,
    name: params.name || 'empty',
    connectorName: params.connectorName || 'empty',
    projection: params.projection || {},
    resolvers: params.resolvers || {},
  },
]

const secretsManager: SecretsManager = {
  getSecret: jest.fn(),
  setSecret: jest.fn(),
  deleteSecret: jest.fn(),
}

let monitoring: {
  error: jest.MockedFunction<NonNullable<Monitoring['error']>>
}

const makeTestRuntime = (): ReadModelRuntime => {
  monitoring = {
    error: jest.fn(),
  }

  return {
    secretsManager,
    monitoring,
  }
}

const setUpTestReadModelInterop = async (readModel: {
  name: string
  projection: any
  resolvers: any
}): Promise<ReadModelInterop> => {
  const readModelInteropMap = getReadModelsInteropBuilder(
    makeReadModelMeta(readModel)
  )(makeTestRuntime())
  return readModelInteropMap[readModel.name]
}

describe('Read models', () => {
  let dummyInitHandler: any
  let dummyEventHandler: any
  let dummyResolver: any
  const dummyStore: any = {}

  beforeEach(() => {
    dummyInitHandler = jest.fn()
    dummyEventHandler = jest.fn()
    dummyResolver = jest.fn()
  })

  test('interop methods should be called with correct arguments', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {
        Init: dummyInitHandler,
        dummyEvent: dummyEventHandler,
      },
      resolvers: {
        all: dummyResolver,
      },
    })

    const initHandler = await readModelInterop.acquireInitHandler(dummyStore)
    initHandler && (await initHandler())

    expect(dummyInitHandler).toBeCalledWith(dummyStore)

    const dummyEvent = {
      type: 'dummyEvent',
      payload: { text: 'first' },
      aggregateId: 'validAggregateId',
      aggregateVersion: 1,
      timestamp: 1,
    }
    const eventHandler = await readModelInterop.acquireEventHandler(
      dummyStore,
      dummyEvent
    )
    eventHandler && (await eventHandler())
    expect(dummyEventHandler).toBeCalledWith(dummyStore, dummyEvent, {})

    const resolve = await readModelInterop.acquireResolver('all', {}, {})
    await resolve(dummyStore, null)
    expect(dummyResolver).toBeCalledWith(
      dummyStore,
      {},
      { jwt: undefined, secretsManager }
    )
  })

  test('interop should return nulls for nonexistent handlers', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {
        dummyEvent: dummyEventHandler,
      },
      resolvers: {
        all: dummyResolver,
      },
    })

    const initHandler = await readModelInterop.acquireInitHandler(dummyStore)

    expect(initHandler).toBeNull()

    const notHandledEvent = {
      type: 'notHandledEvent',
      payload: { text: 'first' },
      aggregateId: 'validAggregateId',
      aggregateVersion: 1,
      timestamp: 1,
    }
    const eventHandler = await readModelInterop.acquireEventHandler(
      dummyStore,
      notHandledEvent
    )
    expect(eventHandler).toBeNull()
  })

  test('interop should throw error when acquiring nonexistent resolver', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {},
      resolvers: {},
    })
    try {
      await readModelInterop.acquireResolver('nonExistentResolver', {}, {})
      fail('Error should be thrown for nonexistent resolver')
    } catch (error) {
      expect(error.message).toEqual(
        'Resolver "nonExistentResolver" does not exist'
      )
    }
  })

  test('#1797: error meta within monitored error on Init handler ', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {
        Init: async () => {
          throw Error('Projection error')
        },
      },
      resolvers: {},
    })

    const initHandler = await readModelInterop.acquireInitHandler(dummyStore)

    try {
      if (initHandler != null) {
        await initHandler()
      }
    } catch {}

    expect(monitoring.error.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(monitoring.error.mock.calls[0][0].message).toEqual(
      'Projection error'
    )
    expect(monitoring.error.mock.calls[0][1]).toEqual('readModelProjection')
    expect(monitoring.error.mock.calls[0][2]).toEqual({
      readModelName: 'TestReadModel',
      eventType: 'Init',
    })
  })

  test('#1797: error meta within monitored error on event handler ', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {
        Failed: async () => {
          throw Error('Projection error')
        },
      },
      resolvers: {},
    })

    const eventHandler = await readModelInterop.acquireEventHandler(
      dummyStore,
      {
        type: 'Failed',
        aggregateId: 'id',
        aggregateVersion: 1,
        timestamp: 1,
      }
    )

    try {
      if (eventHandler != null) {
        await eventHandler()
      }
    } catch {}

    expect(monitoring.error.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(monitoring.error.mock.calls[0][0].message).toEqual(
      'Projection error'
    )
    expect(monitoring.error.mock.calls[0][1]).toEqual('readModelProjection')
    expect(monitoring.error.mock.calls[0][2]).toEqual({
      readModelName: 'TestReadModel',
      eventType: 'Failed',
    })
  })

  test('should register error if resolver not found', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {
        Init: dummyInitHandler,
        dummyEvent: dummyEventHandler,
      },
      resolvers: {
        all: dummyResolver,
      },
    })

    await expect(
      readModelInterop.acquireResolver('not-existing-resolver', {}, {})
    ).rejects.toBeInstanceOf(Error)

    expect(monitoring.error.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(monitoring.error.mock.calls[0][0].message).toEqual(
      expect.stringContaining(`not-existing-resolver`)
    )
    expect(monitoring.error.mock.calls[0][1]).toEqual('readModelResolver')
    expect(monitoring.error.mock.calls[0][2]).toEqual({
      readModelName: 'TestReadModel',
      resolverName: 'not-existing-resolver',
    })
  })

  test('should register error or resolver failure', async () => {
    const readModelInterop = await setUpTestReadModelInterop({
      name: 'TestReadModel',
      projection: {
        Init: dummyInitHandler,
        dummyEvent: dummyEventHandler,
      },
      resolvers: {
        fail: () => {
          throw Error('failed resolver')
        },
      },
    })

    const resolver = await readModelInterop.acquireResolver('fail', {}, {})

    await expect(resolver(null, null)).rejects.toBeInstanceOf(Error)

    expect(monitoring.error.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(monitoring.error.mock.calls[0][0].message).toEqual('failed resolver')
    expect(monitoring.error.mock.calls[0][1]).toEqual('readModelResolver')
    expect(monitoring.error.mock.calls[0][2]).toEqual({
      readModelName: 'TestReadModel',
      resolverName: 'fail',
    })
  })
})
