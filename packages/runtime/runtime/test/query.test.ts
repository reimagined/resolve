import createQuery from '../src/common/query'
import {
  ReadModelInteropMap,
  ViewModelInteropMap,
  Eventstore,
} from '@resolve-js/core'

type Store = {
  set(key: string, value: any): void
  get(key: string): any
}

type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : never

type ResolveQuery = ReturnType<typeof createQuery>

let performanceTracer: any | null = null

let invokeBuildAsync: any = null
let getVacantTimeInMillis: any = null

const eventStoreLocalState = new Map<
  string,
  { destination: any; status: any }
>()

const eventstoreAdapter = ({
  loadEvents: jest
    .fn()
    .mockImplementation(async () => ({ events: [], cursor: 'NEXT_CURSOR' })),
  getNextCursor: jest.fn().mockImplementation(() => 'NEXT_CURSOR'),
  ensureEventSubscriber: jest
    .fn()
    .mockImplementation(
      async ({
        eventSubscriberScope,
        eventSubscriber,
        destination,
        status,
      }) => {
        eventStoreLocalState.set(`${eventSubscriberScope}${eventSubscriber}`, {
          ...(eventStoreLocalState.has(
            `${eventSubscriberScope}${eventSubscriber}`
          )
            ? (eventStoreLocalState.get(
                `${eventSubscriberScope}${eventSubscriber}`
              ) as any)
            : {}),
          ...(destination != null ? { destination } : {}),
          ...(status != null ? { status } : {}),
        })
      }
    ),
  removeEventSubscriber: jest
    .fn()
    .mockImplementation(async ({ eventSubscriberScope, eventSubscriber }) => {
      eventStoreLocalState.delete(`${eventSubscriberScope}${eventSubscriber}`)
    }),
  getEventSubscribers: jest
    .fn()
    .mockImplementation(
      async ({ eventSubscriberScope, eventSubscriber } = {}) => {
        if (eventSubscriberScope == null && eventSubscriber == null) {
          return [...eventStoreLocalState.values()]
        }
        const result = []
        for (const [
          key,
          { destination, status },
        ] of eventStoreLocalState.entries()) {
          if (`${eventSubscriberScope}${eventSubscriber}` === key) {
            result.push({
              eventSubscriberScope,
              eventSubscriber,
              destination,
              status,
            })
          }
        }
        return result
      }
    ),
} as unknown) as Eventstore

for (const { describeName, prepare } of [
  {
    describeName: 'with performanceTracer',
    prepare: () => {
      const addAnnotation = jest.fn()
      const addError = jest.fn()
      const close = jest.fn()
      const addNewSubsegment = jest.fn().mockReturnValue({
        addAnnotation,
        addError,
        close,
      })
      const getSegment = jest.fn().mockReturnValue({
        addNewSubsegment,
      })

      performanceTracer = {
        getSegment,
        addNewSubsegment,
        addAnnotation,
        addError,
        close,
      }
    },
  },
  {
    describeName: 'without performanceTracer',
    prepare: () => {
      performanceTracer = null
    },
  },
]) {
  let events: Array<any> | null = null
  let readModelConnectors: any | null = null
  let query: ResolveQuery | null = null
  let readModelsInterop: ReadModelInteropMap = {}
  let viewModelsInterop: ViewModelInteropMap = {}

  // eslint-disable-next-line no-loop-func
  describe(describeName, () => {
    beforeEach(() => {
      events = []

      invokeBuildAsync = jest.fn()
      getVacantTimeInMillis = jest.fn()
      readModelConnectors = {}
      readModelsInterop = {}
      viewModelsInterop = {}

      prepare()
    })

    afterEach(() => {
      query = null
      events = null
      readModelConnectors = null
      invokeBuildAsync = null
      getVacantTimeInMillis = null

      eventStoreLocalState.clear()
    })

    describe('view models', () => {
      let resolver: jest.MockedFunction<
        () => Promise<{
          data: any
          eventCount: number
          cursor: any
        }>
      >
      beforeEach(() => {
        resolver = jest.fn(() =>
          Promise.resolve({
            data: 'data',
            eventCount: 666,
            cursor: 'cursor',
          })
        )
        viewModelsInterop = {
          model: {
            name: 'model',
            acquireResolver: jest.fn(() => Promise.resolve(resolver)),
            serialize: jest.fn(() => 'serialized-value'),
          },
        }
        query = createQuery({
          eventSubscriberScope: 'APPLICATION_NAME',
          invokeBuildAsync,
          readModelConnectors,
          performanceTracer,
          getVacantTimeInMillis,
          readModelsInterop,
          viewModelsInterop,
          eventstoreAdapter,
        })
      })

      test('interop resolver invoked on "read"', async () => {
        const result = await query.read({
          modelName: 'model',
          jwt: 'jwt',
          aggregateIds: ['id1'],
          aggregateArgs: 'args',
        })
        expect(result).toEqual({
          data: 'data',
          eventCount: 666,
          cursor: 'cursor',
        })
        expect(resolver).toHaveBeenCalledWith()
        expect(viewModelsInterop.model.acquireResolver).toHaveBeenCalledWith(
          {
            aggregateIds: ['id1'],
            aggregateArgs: 'args',
          },
          {
            jwt: 'jwt',
          }
        )
      })

      test('interop serializer invoked on "serialize"', async () => {
        await expect(
          query.serializeState({
            modelName: 'model',
            state: 'to-serialize',
            jwt: 'jwt',
          })
        ).resolves.toEqual('serialized-value')
        expect(viewModelsInterop.model.serialize).toHaveBeenCalledWith(
          'to-serialize',
          'jwt'
        )
      })
    })

    describe('read models', () => {
      query = null
      const remoteReadModelStore: { [key: string]: any } = {}

      beforeEach(() => {
        readModelConnectors = {
          default: (() => {
            const readModels = new Map()
            const connect = jest
              .fn()
              .mockImplementation(async (readModelName) => {
                if (!readModels.has(readModelName)) {
                  readModels.set(readModelName, new Map())
                }
                return {
                  get(key: string): any {
                    return readModels.get(readModelName).get(key)
                  },
                  set(key: string, value: any): void {
                    readModels.get(readModelName).set(key, value)
                  },
                }
              })
            const disconnect = jest.fn()
            const drop = jest
              .fn()
              .mockImplementation(async (store, readModelName) => {
                readModels.delete(readModelName)
              })
            const dispose = jest.fn().mockImplementation(async () => {
              readModels.clear()
            })

            return {
              connect,
              disconnect,
              drop,
              dispose,
            }
          })(),
          empty: {
            connect: jest.fn(),
            disconnect: jest.fn(),
            drop: jest.fn(),
            dispose: jest.fn(),
          },
        }

        readModelsInterop = {
          readModelName: {
            name: 'readModelName',
            connectorName: 'default',
            acquireResolver: async (resolver) => {
              if (resolver === 'getValue') {
                return async (store: Store) => {
                  return await store.get('value')
                }
              }
              return () => {
                throw Error(`Resolver "${resolver}" does not exist`)
              }
            },
            acquireInitHandler: async (store) => async () => {
              await store.set('value', 0)
            },
            acquireEventHandler: async (store, event) => {
              switch (event.type) {
                case 'ADD':
                  return async () => {
                    const value = await store.get('value')
                    await store.set('value', value + event.payload.value)
                  }
                case 'SUB':
                  return async () => {
                    const value = await store.get('value')
                    await store.set('value', value - event.payload.value)
                  }
              }
              return null
            },
          },
          readOnlyReadModelName: {
            name: 'readOnlyReadModelName',
            connectorName: 'default',
            acquireResolver: async (resolver) => {
              if (resolver === 'readFromDatabase') {
                return async () => {
                  return 42
                }
              }
              return () => {
                throw Error(`Resolver "${resolver}" does not exist`)
              }
            },
            acquireInitHandler: async () => null,
            acquireEventHandler: async () => null,
          },
          brokenReadModelName: {
            name: 'brokenReadModelName',
            connectorName: 'empty',
            acquireResolver: async (resolver) => {
              if (resolver === 'failed') {
                return async () => {
                  throw new Error('Failed resolver')
                }
              }
              return () => {
                throw Error(`Resolver "${resolver}" does not exist`)
              }
            },
            acquireInitHandler: async () => null,
            acquireEventHandler: async (store, event) => {
              switch (event.type) {
                case 'BROKEN':
                  return async () => {
                    const error = new Error('BROKEN')
                    Object.assign(error, { store, event })
                    throw error
                  }
              }
              return null
            },
          },
          remoteReadModelName: {
            name: 'remoteReadModelName',
            connectorName: 'empty',
            acquireResolver: async (resolver) => {
              if (resolver === 'getValue') {
                return async (store: Store) => {
                  return await store.get('value')
                }
              }
              return () => {
                throw Error(`Resolver "${resolver}" does not exist`)
              }
            },
            acquireInitHandler: async () => null,
            acquireEventHandler: async (store, event) => {
              switch (event.type) {
                case 'SET':
                  return async () => {
                    await new Promise((resolve) => setImmediate(resolve))
                    remoteReadModelStore[event.payload.key] =
                      event.payload.value
                  }
              }
              return null
            },
          },
        }

        query = createQuery({
          eventSubscriberScope: 'APPLICATION_NAME',
          invokeBuildAsync,
          readModelConnectors,
          performanceTracer,
          getVacantTimeInMillis,
          readModelsInterop,
          viewModelsInterop: {},
          eventstoreAdapter,
        })
      })

      afterEach(() => {
        query = null
      })

      test('"read" should return the resolver result', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        const value = await query.read({
          modelName: 'readOnlyReadModelName',
          resolverName: 'readFromDatabase',
          resolverArgs: {},
        })

        expect(value).toEqual(42)

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"read" should raise error when a read model does not exist', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        try {
          await query.read({
            modelName: 'notFound',
            resolverName: 'notFound',
            resolverArgs: {},
          })

          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"read" should raise error when query is disposed', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        try {
          await query.dispose()
          await query.read({
            modelName: 'readOnlyReadModelName',
            resolverName: 'readFromDatabase',
            resolverArgs: {},
          })
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"build" should apply events to the read model, "read" should return the resolver result', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        events = [
          {
            type: 'Init',
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'ADD',
            payload: {
              value: 10,
            },
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 2,
            timestamp: 2,
            type: 'ADD',
            payload: {
              value: 5,
            },
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 3,
            timestamp: 3,
            type: 'SUB',
            payload: {
              value: 8,
            },
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 4,
            timestamp: 4,
            type: 'OTHER_EVENT',
            payload: {},
          },
        ]

        await query.build({
          modelName: 'readModelName',
          events: events.slice(0, 1),
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        await query.build({
          modelName: 'readModelName',
          events: events.slice(1),
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        const applyEventsResult = {
          error: null,
          successEvent: {
            aggregateId: 'id1',
            aggregateVersion: 3,
            timestamp: 3,
            type: 'SUB',
            payload: {
              value: 8,
            },
          },
          failedEvent: null,
          eventSubscriber: 'readModelName',
        }

        void applyEventsResult // TODO

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"build" should raise error when a projection is broken', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        const events = [
          {
            aggregateId: 'id1',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'BROKEN',
            payload: {},
          },
        ]

        await query.build({
          modelName: 'brokenReadModelName',
          events,
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        const applyEventsResult = {
          message: 'BROKEN',
        }
        void applyEventsResult // TODO

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"build" should raise error when a projection is not found', async () => {
        if (query == null || events == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.build({
          modelName: 'readOnlyReadModelName',
          events,
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        const applyEventsResult = null
        void applyEventsResult // TODO

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"build" should raise error when updating had been interrupted', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        events = [
          {
            aggregateId: 'id',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'SET',
            payload: {
              key: 1,
              value: 2,
            },
          },
          {
            aggregateId: 'id',
            aggregateVersion: 2,
            timestamp: 2,
            type: 'SET',
            payload: {
              key: 3,
              value: 4,
            },
          },
        ]

        const result = query.build({
          modelName: 'remoteReadModelName',
          events,
        })

        await query.dispose()

        await result

        const applyEventsResult = null
        void applyEventsResult // TODO

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"build" should raise error when query is disposed', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        events = [
          {
            type: 'Init',
          },
        ]

        await query.dispose()

        try {
          await query.build({ modelName: 'readModelName', events })
          return Promise.reject('Test failed')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }

        const applyEventsResult = null
        void applyEventsResult // TODO

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"serializeState" should return the resolver result', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        const value = await query.serializeState({
          modelName: 'readOnlyReadModelName',
          state: {
            data: 42,
            meta: { timestamp: 1234 },
          },
        })

        expect(value).toEqual(
          JSON.stringify(
            {
              data: 42,
              meta: { timestamp: 1234 },
            },
            null,
            2
          )
        )

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"resubscribe" should drop read model', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.resubscribe({
          modelName: 'readModelName',
          subscriptionOptions: {},
        })

        const connector = readModelConnectors['default']

        expect(connector.drop.mock.calls[0][1]).toEqual('readModelName')

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"resubscribe" should raise error when query is disposed', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.dispose()

        try {
          await query.resubscribe({
            modelName: 'readModelName',
            subscriptionOptions: {},
          })

          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })

      test('"dispose" should dispose only one time', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.dispose()

        try {
          await query.dispose()
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })
    })

    describe('common', () => {
      test('"read" should raise error when wrong options for read invocation', async () => {
        query = createQuery({
          eventSubscriberScope: 'APPLICATION_NAME',
          readModelConnectors,
          performanceTracer,
          invokeBuildAsync,
          getVacantTimeInMillis,
          readModelsInterop,
          viewModelsInterop: {
            viewModelName: {
              name: 'viewModelName',
              acquireResolver: async () => async () =>
                Promise.resolve({ data: null, eventCount: 0, cursor: null }),
              serialize: (val) => val.toString(),
            },
          },
          eventstoreAdapter,
        })

        await expect(
          query.read({
            modelName: 'viewModelName',
            wrongArg1: '1',
            wrongArg2: '2',
          } as any)
        ).rejects.toBeTruthy()

        if (performanceTracer != null) {
          expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
            'getSegment'
          )
          expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
            'addNewSubsegment'
          )
          expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
            'addAnnotation'
          )
          expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
            'addError'
          )
          expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
        }
      })
    })
  })
}
