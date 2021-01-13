import createQuery from '../../resolve-runtime/src/common/query'
import { IS_BUILT_IN, SecretsManager } from 'resolve-core'
import { ReadModelInteropMap } from 'resolve-runtime-interop'

type State = {
  value: number
}

type Store = {
  set(key: string, value: any): void
  get(key: string): any
}

type Event = {
  payload: {
    value: number
  }
}

type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : never

type ResolveQuery = ReturnType<typeof createQuery>

type AddEvent = Event
type SubEvent = Event

type ResolverQuery = {
  aggregateIds: Array<string>
  eventTypes: Array<string>
}

let performanceTracer: any | null = null

let invokeEventBusAsync: any = null
let getVacantTimeInMillis: any = null
let performAcknowledge: any = null

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
  let eventstoreAdapter: any | null = null

  type SnapshotMap = Map<string, any>
  let snapshots: SnapshotMap | null = null

  let viewModels: any | null = null
  let readModels: any | null = null
  let readModelConnectors: any | null = null
  let query: ResolveQuery | null = null
  let secretsManager: SecretsManager | null = null
  let modelsInterop: ReadModelInteropMap = {}

  // eslint-disable-next-line no-loop-func
  describe(describeName, () => {
    beforeEach(() => {
      events = []

      snapshots = new Map()

      invokeEventBusAsync = jest.fn()
      getVacantTimeInMillis = jest.fn()
      performAcknowledge = jest.fn()
      const secretsMap = new Map()
      secretsManager = {
        getSecret: async (key: any) => secretsMap.get(key),
        setSecret: async (key: any, value: any) => {
          secretsMap.set(key, value)
        },
        deleteSecret: async (key: any) => {
          secretsMap.delete(key)
        },
      }

      eventstoreAdapter = {
        loadEvents: async ({ cursor: prevCursor }: { cursor: string }) => ({
          events,
          cursor: `${prevCursor == null ? '' : `${prevCursor}-`}CURSOR`,
        }),
        getNextCursor: (prevCursor: string) =>
          `${prevCursor == null ? '' : `${prevCursor}-`}CURSOR`,
        getSecretsManager: jest.fn(() => secretsManager),
        loadSnapshot: jest.fn().mockImplementation(async (key) => {
          return (snapshots as SnapshotMap).get(key)
        }),
        saveSnapshot: jest.fn().mockImplementation(async (key, value) => {
          void (snapshots as SnapshotMap).set(key, value)
        }),
      }

      viewModels = []
      readModels = []
      readModelConnectors = {}

      modelsInterop = {}

      prepare()
    })

    afterEach(() => {
      query = null
      events = null
      eventstoreAdapter = null
      snapshots = null
      viewModels = null
      readModels = null
      readModelConnectors = null
      invokeEventBusAsync = null
      getVacantTimeInMillis = null
      performAcknowledge = null
    })

    describe('view models', () => {
      beforeEach(() => {
        const builtInSerializer = JSON.stringify as any
        const builtInDeserializer = JSON.parse as any

        builtInSerializer[IS_BUILT_IN] = true
        builtInDeserializer[IS_BUILT_IN] = true

        viewModels = [
          {
            name: 'viewModelName',
            projection: {
              Init: (): State => {
                return {
                  value: 0,
                }
              },
              ADD: (state: State, event: AddEvent): State => {
                return {
                  ...state,
                  value: state.value + event.payload.value,
                }
              },
              SUB: (state: State, event: SubEvent): State => {
                return {
                  ...state,
                  value: state.value - event.payload.value,
                }
              },
            },
            serializeState: jest.fn((state: State) => {
              return `>>>${JSON.stringify(state, null, 2)}`
            }),
            deserializeState: jest.fn((serializedState: string) => {
              return JSON.parse(serializedState.slice(3))
            }),
            invariantHash: 'viewModelName-invariantHash',
            encryption: () => ({}),
            resolver: async (
              resolve: any,
              query: ResolverQuery,
              { viewModel }: any
            ): Promise<{
              data: any
              meta: any
            }> => {
              const { data, cursor } = await resolve.buildViewModel(
                viewModel.name,
                query
              )

              return {
                data,
                meta: {
                  aggregateIds: query.aggregateIds,
                  eventTypes: viewModel.eventTypes,
                  cursor,
                },
              }
            },
          },
          {
            name: 'viewModelWithBuiltInSerializer',
            projection: {
              Init: () => null,
            },
            serializeState: builtInSerializer,
            deserializeState: builtInDeserializer,
            invariantHash: 'viewModelName-invariantHash',
            encryption: () => ({}),
            resolver: async (
              resolve: any,
              query: ResolverQuery,
              { viewModel }: any
            ): Promise<{
              data: any
              meta: any
            }> => {
              const { data, cursor } = await resolve.buildViewModel(
                viewModel.name,
                query
              )

              return {
                data,
                meta: {
                  aggregateIds: query.aggregateIds,
                  eventTypes: viewModel.eventTypes,
                  cursor,
                },
              }
            },
          },
          {
            name: 'viewModelWithErrors',
            projection: {
              Init: () => null,
              Failed: () => {
                throw new Error('View model is failed')
              },
            },
            invariantHash: 'viewModelName-invariantHash',
            encryption: () => ({}),
            resolver: async () => {
              throw new Error('Resolver failed')
            },
          },
        ]
      })

      describe('with snapshots', () => {
        query = null

        beforeEach(() => {
          query = createQuery({
            invokeEventBusAsync,
            readModelConnectors,
            readModels,
            viewModels,
            performanceTracer,
            eventstoreAdapter,
            getVacantTimeInMillis,
            performAcknowledge,
            modelsInterop,
          })
        })

        afterEach(() => {
          query = null
        })

        test('"read" should return state', async () => {
          if (query == null) {
            throw new Error('Query is null')
          }

          events = [
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
          ]

          const stateId1 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
          })

          expect(stateId1).toEqual({
            data: {
              value: 7,
            },
            meta: {
              cursor: 'CURSOR-CURSOR-CURSOR',
              aggregateIds: ['id1'],
              eventTypes: ['ADD', 'SUB'],
            },
          })

          expect(eventstoreAdapter.loadSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1'
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 1]],
              state: `>>>${JSON.stringify({ value: 10 }, null, 2)}`,
              cursor: 'CURSOR',
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 2]],
              state: `>>>${JSON.stringify({ value: 15 }, null, 2)}`,
              cursor: 'CURSOR-CURSOR',
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 3]],
              state: `>>>${JSON.stringify({ value: 7 }, null, 2)}`,
              cursor: 'CURSOR-CURSOR-CURSOR',
            })
          )

          events = [
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5,
              },
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2,
              },
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3,
              },
            },
          ]
          const stateId2 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {},
          })

          expect(stateId2).toEqual({
            data: {
              value: 4,
            },
            meta: {
              cursor: 'CURSOR-CURSOR-CURSOR',
              aggregateIds: ['id2'],
              eventTypes: ['ADD', 'SUB'],
            },
          })

          expect(eventstoreAdapter.loadSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2'
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 1]],
              state: `>>>${JSON.stringify({ value: 5 }, null, 2)}`,
              cursor: 'CURSOR',
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 2]],
              state: `>>>${JSON.stringify({ value: 7 }, null, 2)}`,
              cursor: 'CURSOR-CURSOR',
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 3]],
              state: `>>>${JSON.stringify({ value: 4 }, null, 2)}`,
              cursor: 'CURSOR-CURSOR-CURSOR',
            })
          )

          events = []

          const stateId2Second = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {},
          })

          expect(stateId2Second).toEqual(stateId2)

          events = [
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
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5,
              },
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2,
              },
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3,
              },
            },
          ]

          const stateWildcard = await query.read({
            modelName: 'viewModelName',
            aggregateIds: '*',
            aggregateArgs: {},
          })

          expect(stateWildcard).toEqual({
            data: {
              value: 11,
            },
            meta: {
              cursor: 'CURSOR-CURSOR-CURSOR-CURSOR-CURSOR-CURSOR',
              aggregateIds: null,
              eventTypes: ['ADD', 'SUB'],
            },
          })

          const stateId1AndId2 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1,id2',
            aggregateArgs: {},
          })

          expect(stateId1AndId2).toEqual({
            data: {
              value: 11,
            },
            meta: {
              cursor: 'CURSOR-CURSOR-CURSOR-CURSOR-CURSOR-CURSOR',
              aggregateIds: ['id1', 'id2'],
              eventTypes: ['ADD', 'SUB'],
            },
          })

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"read" should call view model\'s serialization routine with valid parameters', async () => {
          if (query == null) {
            throw new Error('Query is null')
          }

          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10,
              },
            },
          ]

          await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
            jwt: 'query-jwt',
          })

          const { serializeState } = viewModels[0]
          expect(serializeState).toHaveBeenCalledWith(
            { value: 10 },
            'query-jwt'
          )
        })

        test('"read" should reuse working build process', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          const state1Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
          })

          const state2Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
          })

          expect(state1Promise).toEqual(state2Promise)

          await state1Promise
          await state2Promise

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"read" should raise error when aggregateIds is a bad value', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: Symbol('BAD_VALUE'),
              aggregateArgs: {},
            })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"read" should raise error when a view model does not exist', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.read({
              modelName: 'notFound',
              aggregateIds: 'id1',
              aggregateArgs: {},
            })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
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

          await query.dispose()
          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: 'id1',
              aggregateArgs: {},
            })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"read" calls monitoring.error if resolver is failed', async () => {
          const monitoring = {
            error: jest.fn(),
          }

          query = createQuery({
            invokeEventBusAsync,
            readModelConnectors,
            readModels,
            viewModels,
            performanceTracer,
            eventstoreAdapter,
            getVacantTimeInMillis,
            performAcknowledge,
            monitoring,
            modelsInterop,
          })

          try {
            await query.read({
              modelName: 'viewModelWithErrors',
              aggregateIds: 'id1',
              aggregateArgs: {},
            })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
            expect(monitoring.error).toBeCalledWith(
              error,
              'viewModelResolver',
              {
                viewModelName: 'viewModelWithErrors',
              }
            )
          }
        })

        test('"serializeState" should return JSON by with built-in serializer', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          const result = await query.serializeState({
            modelName: 'viewModelName',
            state: {
              data: { value: 7 },
              meta: { timestamp: 3 },
            },
          })

          expect(result).toEqual(
            JSON.stringify(
              {
                data: `>>>${JSON.stringify({ value: 7 }, null, 2)}`,
                meta: { timestamp: 3 },
              },
              null,
              2
            )
          )

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"serializeState" should return JSON with serialized data', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          const result = await query.serializeState({
            modelName: 'viewModelWithBuiltInSerializer',
            state: {
              data: { value: 7 },
              meta: { timestamp: 3 },
            },
          })

          expect(result).toEqual(
            JSON.stringify(
              {
                data: { value: 7 },
                meta: { timestamp: 3 },
              },
              null,
              2
            )
          )
        })

        test('"sendEvents" should raise error on view models', async () => {
          if (query == null || events == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.sendEvents({ modelName: 'viewModelName', events })
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          expect(eventstoreAdapter.loadSnapshot).not.toBeCalled()
          expect(eventstoreAdapter.loadSnapshot).not.toBeCalled()

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"sendEvents" should raise error when query is disposed', async () => {
          if (query == null || events == null) {
            throw new Error('Some of test tools are not initialized')
          }

          await query.dispose()
          try {
            await query.sendEvents({ modelName: 'viewModelName', events })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"drop" should raise error on view models', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.drop({ modelName: 'viewModelName' })
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          expect(eventstoreAdapter.loadSnapshot).not.toBeCalled()
          expect(eventstoreAdapter.loadSnapshot).not.toBeCalled()

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"drop" should raise error when query is disposed', async () => {
          if (query == null || events == null) {
            throw new Error('Some of test tools are not initialized')
          }

          await query.dispose()
          try {
            await query.sendEvents({ modelName: 'viewModelName', events })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
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

          expect(eventstoreAdapter.loadSnapshot).not.toBeCalled()
          expect(eventstoreAdapter.loadSnapshot).not.toBeCalled()

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
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

      describe('without snapshots', () => {
        query = null

        beforeEach(() => {
          query = createQuery({
            invokeEventBusAsync,
            readModelConnectors,
            readModels,
            viewModels,
            performanceTracer,
            eventstoreAdapter,
            getVacantTimeInMillis,
            performAcknowledge,
            modelsInterop,
          })
        })

        afterEach(() => {
          query = null
        })

        test('"read" should return state', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          events = [
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
          ]

          const stateId1 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
          })

          expect(stateId1).toEqual({
            data: { value: 7 },
            meta: {
              cursor: 'CURSOR-CURSOR-CURSOR',
              aggregateIds: ['id1'],
              eventTypes: ['ADD', 'SUB'],
            },
          })

          events = [
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5,
              },
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2,
              },
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3,
              },
            },
          ]

          const stateId2 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {},
          })

          expect(stateId2).toEqual({
            data: { value: 4 },
            meta: {
              cursor: 'CURSOR-CURSOR-CURSOR',
              aggregateIds: ['id2'],
              eventTypes: ['ADD', 'SUB'],
            },
          })

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"read" should reuse working build process', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          events = [
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
          ]

          const state1Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
          })

          const state2Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {},
          })

          expect(state1Promise).toEqual(state2Promise)

          await state1Promise
          await state2Promise

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
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

          await query.dispose()
          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: 'id1',
              aggregateArgs: {},
            })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"read" should raise error when aggregateIds is a bad value', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: Symbol('BAD_VALUE'),
              aggregateArgs: {},
            })

            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"serializeState" should return JSON by with built-in serializer', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          const result = await query.serializeState({
            modelName: 'viewModelName',
            state: {
              data: { value: 7 },
              meta: { timestamp: 12345 },
            },
          })

          expect(result).toEqual(
            JSON.stringify(
              {
                data: `>>>${JSON.stringify({ value: 7 }, null, 2)}`,
                meta: { timestamp: 12345 },
              },
              null,
              2
            )
          )

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"serializeState" should return JSON with serialized data', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          const result = await query.serializeState({
            modelName: 'viewModelWithBuiltInSerializer',
            state: {
              data: { value: 7 },
              meta: { timestamp: 12345 },
            },
          })

          expect(result).toEqual(
            JSON.stringify(
              {
                data: { value: 7 },
                meta: { timestamp: 12345 },
              },
              null,
              2
            )
          )
        })

        test('"sendEvents" should raise error on view models', async () => {
          if (query == null || events == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.sendEvents({ modelName: 'viewModelName', events })
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"sendEvents" should raise error when disposed', async () => {
          if (query == null || events == null) {
            throw new Error('Some of test tools are not initialized')
          }

          await query.dispose()
          try {
            await query.sendEvents({ modelName: 'viewModelName', events })
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"drop" should raise error on view-model', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          try {
            await query.drop({ modelName: 'viewModelName' })
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
            expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
              'addAnnotation'
            )
            expect(performanceTracer.addError.mock.calls).toMatchSnapshot(
              'addError'
            )
            expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
          }
        })

        test('"drop" should raise error when disposed', async () => {
          if (query == null) {
            throw new Error('Some of test tools are not initialized')
          }

          await query.dispose()
          try {
            await query.drop({ modelName: 'viewModelName' })
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          if (performanceTracer != null) {
            expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
              'getSegment'
            )
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
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
            expect(
              performanceTracer.addNewSubsegment.mock.calls
            ).toMatchSnapshot('addNewSubsegment')
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

    describe('read models', () => {
      query = null
      let decrypt: jest.Mock | null = null
      let encrypt: jest.Mock | null = null
      let encryption: jest.Mock | null = null
      const remoteReadModelStore: { [key: string]: any } = {}

      beforeEach(() => {
        decrypt = jest.fn((v: string) => `plain_${v}`)
        encrypt = jest.fn((v: string) => `encrypted_${v}`)
        encryption = jest.fn(() => ({
          encrypt,
          decrypt,
        }))

        // FIXME: remove after implementing acquireEventHandler
        readModels = [
          {
            name: 'readModelName',
            projection: {
              Init: async (store: Store) => {
                await store.set('value', 0)
              },
              ADD: async (store: Store, event: AddEvent) => {
                const value = await store.get('value')
                await store.set('value', value + event.payload.value)
              },
              SUB: async (store: Store, event: SubEvent) => {
                const value = await store.get('value')
                await store.set('value', value - event.payload.value)
              },
            },
            resolvers: {
              getValue: async (store: Store) => {
                return await store.get('value')
              },
            },
            connectorName: 'default',
            invariantHash: 'readModelName-invariantHash',
            encryption,
          },
          {
            name: 'readOnlyReadModelName',
            projection: null,
            resolvers: {
              readFromDatabase: async () => {
                return 42
              },
            },
            connectorName: 'default',
            invariantHash: 'readOnlyReadModelName-invariantHash',
            encryption,
          },
          {
            name: 'brokenReadModelName',
            projection: {
              BROKEN: async (store: Store, event: any) => {
                const error = new Error('BROKEN')
                Object.assign(error, { store, event })
                throw error
              },
            },
            resolvers: {
              failed: async () => {
                throw new Error('Failed resolver')
              },
            },
            connectorName: 'empty',
            invariantHash: 'brokenReadModelName-invariantHash',
            encryption,
          },
          {
            name: 'remoteReadModelName',
            projection: {
              SET: async (store: Store, event: any) => {
                await new Promise((resolve) => setImmediate(resolve))
                remoteReadModelStore[event.payload.key] = event.payload.value
              },
            },
            resolvers: {
              getValue: async (store: Store) => {
                return await store.get('value')
              },
            },
            connectorName: 'empty',
            invariantHash: 'remoteReadModelName-invariantHash',
            encryption,
          },
          {
            name: 'encryptedReadModel',
            projection: {
              PUSH: async (
                store: Store,
                event: any,
                { decrypt, encrypt }: any
              ) => {
                await new Promise((resolve) => setImmediate(resolve))
                await store.set('id', {
                  plain: decrypt(event.payload.value),
                  encrypted: encrypt(event.payload.value),
                })
              },
            },
            resolvers: {
              getValue: async (store: Store) => {
                return await store.get('id')
              },
            },
            connectorName: 'default',
            invariantHash: 'encryptedReadModelName-invariantHash',
            encryption,
          },
        ]

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
            const dispose = jest.fn().mockImplementation(async (a: string) => {
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

        modelsInterop = {
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
          },
          encryptedReadModel: {
            name: 'encryptedReadModel',
            connectorName: 'default',
            acquireResolver: async (resolver) => {
              if (resolver === 'getValue') {
                return async (store: Store) => {
                  return await store.get('id')
                }
              }
              return () => {
                throw Error(`Resolver "${resolver}" does not exist`)
              }
            },
          },
        }

        query = createQuery({
          invokeEventBusAsync,
          readModelConnectors,
          readModels,
          viewModels,
          performanceTracer,
          eventstoreAdapter,
          getVacantTimeInMillis,
          performAcknowledge,
          modelsInterop,
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

      test('"read" should raise error when a resolver is not found', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        try {
          await query.read({
            modelName: 'readModelName',
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

      test('"read" calls monitoring.error if resolver is failed', async () => {
        const monitoring = {
          error: jest.fn(),
        }

        query = createQuery({
          invokeEventBusAsync,
          readModelConnectors,
          readModels,
          viewModels,
          performanceTracer,
          eventstoreAdapter,
          getVacantTimeInMillis,
          performAcknowledge,
          monitoring,
          modelsInterop,
        })

        try {
          await query.read({
            modelName: 'brokenReadModelName',
            resolverName: 'failed',
            resolverArgs: {},
          })

          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(monitoring.error).toBeCalledWith(error, 'readModelResolver', {
            readModelName: 'brokenReadModelName',
            resolverName: 'failed',
          })
        }
      })

      test('"sendEvents" with encryption', async () => {
        events = [
          {
            type: 'Init',
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'PUSH',
            payload: {
              value: 'data',
            },
          },
        ]

        await query.sendEvents({
          modelName: 'encryptedReadModel',
          events: events.slice(0, 1),
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        await query.sendEvents({
          modelName: 'encryptedReadModel',
          events: events.slice(1),
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        expect(encryption).toHaveBeenCalledWith(events[1], { secretsManager })
        expect(encrypt).toHaveBeenCalledWith('data')
        expect(decrypt).toHaveBeenCalledWith('data')

        const { plain, encrypted } = await query.read({
          modelName: 'encryptedReadModel',
          resolverName: 'getValue',
          resolverArgs: {},
        })

        expect(plain).toEqual('plain_data')
        expect(encrypted).toEqual('encrypted_data')
      })

      test('"sendEvents" should apply events to the read model, "read" should return the resolver result', async () => {
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

        await query.sendEvents({
          modelName: 'readModelName',
          events: events.slice(0, 1),
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        await query.sendEvents({
          modelName: 'readModelName',
          events: events.slice(1),
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        expect(performAcknowledge.mock.calls[1][0].result).toMatchObject({
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
        })

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

      test('"sendEvents" should raise error when a projection is broken', async () => {
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

        await query.sendEvents({
          modelName: 'brokenReadModelName',
          events,
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        expect(performAcknowledge.mock.calls[0][0].result.error).toMatchObject({
          message: 'BROKEN',
        })

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

      test('"sendEvents" calls monitoring.error if resolver is failed', async () => {
        const monitoring = {
          error: jest.fn(),
        }

        query = createQuery({
          invokeEventBusAsync,
          readModelConnectors,
          readModels,
          viewModels,
          performanceTracer,
          eventstoreAdapter,
          getVacantTimeInMillis,
          performAcknowledge,
          monitoring,
          modelsInterop,
        })

        const events = [
          {
            aggregateId: 'id1',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'BROKEN',
            payload: {},
          },
        ]

        await query.sendEvents({
          modelName: 'brokenReadModelName',
          events,
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        expect(monitoring.error).toBeCalledWith(
          expect.objectContaining({
            message: 'BROKEN',
          }),
          'readModelProjection',
          {
            readModelName: 'brokenReadModelName',
            eventType: 'BROKEN',
          }
        )
      })

      test('"sendEvents" should raise error when a projection is not found', async () => {
        if (query == null || events == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.sendEvents({
          modelName: 'readOnlyReadModelName',
          events,
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        expect(performAcknowledge.mock.calls[0][0].result.error).not.toBeNull()

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

      test('"sendEvents" should raise error when events is not array', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.sendEvents({
          modelName: 'readOnlyReadModelName',
          events: (null as unknown) as any[],
          xaTransactionId: 'xaTransactionId',
          properties: {},
          batchId: 'batchId',
        })

        expect(performAcknowledge.mock.calls[0][0].result.error).not.toBeNull()

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

      test('"sendEvents" should raise error when updating had been interrupted', async () => {
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

        const result = query.sendEvents({
          modelName: 'remoteReadModelName',
          events,
        })

        await query.dispose()

        await result

        expect(performAcknowledge.mock.calls[0][0].result.error).not.toBeNull()

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

      test('"sendEvents" should raise error when query is disposed', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        events = [
          {
            type: 'Init',
          },
        ]

        await query.dispose()

        await query.sendEvents({ modelName: 'readModelName', events })

        expect(performAcknowledge.mock.calls[0][0].result.error).not.toBeNull()

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

      test('"drop" should drop read model', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.drop({ modelName: 'readModelName' })

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

      test('"drop" should raise error when query is disposed', async () => {
        if (query == null) {
          throw new Error('Some of test tools are not initialized')
        }

        await query.dispose()

        try {
          await query.drop({ modelName: 'readModelName' })

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
      test('"createQuery" should raise error when a read model is declared without a connector', async () => {
        expect(
          () =>
            (query = createQuery({
              readModelConnectors: {},
              readModels: [
                {
                  name: 'readModelName',
                  projection: {},
                  resolvers: {},
                  connectorName: 'default',
                  invariantHash: 'readModelName-invariantHash',
                },
              ],
              viewModels,
              eventstoreAdapter,
              performanceTracer,
              invokeEventBusAsync,
              getVacantTimeInMillis,
              performAcknowledge,
              modelsInterop,
            }))
        ).toThrow(Error)
      })

      test('"createQuery" should raise error when a read model is declared twice', async () => {
        expect(
          () =>
            (query = createQuery({
              readModelConnectors: {
                empty: {
                  connect: jest.fn(),
                  disconnect: jest.fn(),
                  drop: jest.fn(),
                  dispose: jest.fn(),
                },
              },
              readModels: [
                {
                  name: 'readModelName',
                  projection: {},
                  resolvers: {},
                  connectorName: 'empty',
                  invariantHash: 'readModelName-invariantHash',
                },
                {
                  name: 'readModelName',
                  projection: {},
                  resolvers: {},
                  connectorName: 'empty',
                  invariantHash: 'readModelName-invariantHash',
                },
              ],
              viewModels,
              eventstoreAdapter,
              performanceTracer,
              invokeEventBusAsync,
              getVacantTimeInMillis,
              performAcknowledge,
              modelsInterop,
            }))
        ).toThrow('Duplicate name for read model: "readModelName"')

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

      test('"createQuery" should raise error when a view model is declared twice', async () => {
        expect(
          () =>
            (query = createQuery({
              readModelConnectors,
              readModels,
              viewModels: [
                {
                  name: 'viewModelName',
                  projection: {},
                  invariantHash: 'viewModelName-invariantHash',
                },
                {
                  name: 'viewModelName',
                  projection: {},
                  invariantHash: 'viewModelName-invariantHash',
                },
              ],
              eventstoreAdapter,
              performanceTracer,
              invokeEventBusAsync,
              getVacantTimeInMillis,
              performAcknowledge,
              modelsInterop,
            }))
        ).toThrow('Duplicate name for view model: "viewModelName"')

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

      test('"read" should raise error when wrong options for read invocation', async () => {
        query = createQuery({
          readModelConnectors,
          readModels,
          viewModels: [
            {
              name: 'viewModelName',
              projection: {},
              invariantHash: 'viewModelName-invariantHash',
            },
          ],
          eventstoreAdapter,
          performanceTracer,
          invokeEventBusAsync,
          getVacantTimeInMillis,
          performAcknowledge,
          modelsInterop,
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
