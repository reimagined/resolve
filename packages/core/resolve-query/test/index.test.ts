import createQuery from '../src/index'

let events: any[]
let eventstoreAdapter: any
let snapshots: Map<string, any>
let viewModels: any[]
let readModels: any[]
let readModelConnectors: { [key: string]: any }
let query: any
let performanceTracer: any

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
        close
      })
      const getSegment = jest.fn().mockReturnValue({
        addNewSubsegment
      })

      performanceTracer = {
        getSegment,
        addNewSubsegment,
        addAnnotation,
        addError,
        close
      }
    }
  },
  {
    describeName: 'without performanceTracer',
    prepare: () => {
      performanceTracer = null
    }
  }
]) {
  // eslint-disable-next-line no-loop-func
  describe(describeName, () => {
    beforeEach(() => {
      events = []
      snapshots = new Map()
      eventstoreAdapter = {
        loadEvents: async ({ cursor: prevCursor }: { cursor: any }) => ({
          events,
          cursor: `${prevCursor == null ? '' : `${prevCursor}-`}CURSOR`
        }),
        getNextCursor: (prevCursor: any) =>
          `${prevCursor == null ? '' : `${prevCursor}-`}CURSOR`,
        getSecretsManager: async () => null,
        loadSnapshot: jest.fn().mockImplementation(async key => {
          return snapshots.get(key)
        }),
        saveSnapshot: jest.fn().mockImplementation(async (key, value) => {
          snapshots.set(key, value)
        })
      }

      viewModels = []
      readModels = []
      readModelConnectors = {}

      prepare()
    })

    afterEach(() => {
      query = null
    })

    describe('view models', () => {
      beforeEach(() => {
        viewModels = [
          {
            name: 'viewModelName',
            projection: {
              Init: () => {
                return {
                  value: 0
                }
              },
              ADD: (state: any, event: any) => {
                return {
                  ...state,
                  value: state.value + event.payload.value
                }
              },
              SUB: (state: any, event: any) => {
                return {
                  ...state,
                  value: state.value - event.payload.value
                }
              }
            },
            serializeState: async (state: any) => {
              return JSON.stringify(state, null, 2)
            },
            deserializeState: async (serializedState: string) => {
              return JSON.parse(serializedState)
            },
            invariantHash: 'viewModelName-invariantHash',
            encryption: () => ({})
          }
        ]
      })

      describe('with snapshots', () => {
        query = null

        beforeEach(() => {
          query = createQuery({
            readModelConnectors,
            readModels,
            viewModels,
            eventstoreAdapter,
            performanceTracer
          })
        })

        afterEach(() => {
          query = null
        })

        test('"read" should return state', async () => {
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const stateId1 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          expect(stateId1).toEqual({
            value: 7
          })

          expect(eventstoreAdapter.loadSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1'
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 1]],
              state: JSON.stringify({ value: 10 }, null, 2),
              cursor: 'CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 2]],
              state: JSON.stringify({ value: 15 }, null, 2),
              cursor: 'CURSOR-CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 3]],
              state: JSON.stringify({ value: 7 }, null, 2),
              cursor: 'CURSOR-CURSOR-CURSOR'
            })
          )

          events = [
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3
              }
            }
          ]
          const stateId2 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {}
          })

          expect(stateId2).toEqual({
            value: 4
          })

          expect(eventstoreAdapter.loadSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2'
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 1]],
              state: JSON.stringify({ value: 5 }, null, 2),
              cursor: 'CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 2]],
              state: JSON.stringify({ value: 7 }, null, 2),
              cursor: 'CURSOR-CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 3]],
              state: JSON.stringify({ value: 4 }, null, 2),
              cursor: 'CURSOR-CURSOR-CURSOR'
            })
          )

          events = []

          const stateId2Second = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {}
          })

          expect(stateId2Second).toEqual(stateId2)

          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            },
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3
              }
            }
          ]

          const stateWildcard = await query.read({
            modelName: 'viewModelName',
            aggregateIds: '*',
            aggregateArgs: {}
          })

          expect(stateWildcard).toEqual({ value: 11 })

          const stateId1AndId2 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1,id2',
            aggregateArgs: {}
          })

          expect(stateId1AndId2).toEqual({ value: 11 })

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
          const state1Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          const state2Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
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

        test('"read" should raise error when interrupted', async () => {
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const statePromise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          await query.dispose('viewModelName')

          try {
            await statePromise

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
          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: Symbol('BAD_VALUE'),
              aggregateArgs: {}
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
          try {
            await query.read({
              modelName: 'notFound',
              aggregateIds: 'id1',
              aggregateArgs: {}
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
          await query.dispose()
          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: 'id1',
              aggregateArgs: {}
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

        test('"readAndSerialize" should return serialized state', async () => {
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const stateId1 = await query.readAndSerialize({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          expect(stateId1).toEqual(
            JSON.stringify(
              {
                value: 7
              },
              null,
              2
            )
          )

          expect(eventstoreAdapter.loadSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1'
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 1]],
              state: JSON.stringify({ value: 10 }, null, 2),
              cursor: 'CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 2]],
              state: JSON.stringify({ value: 15 }, null, 2),
              cursor: 'CURSOR-CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id1',
            JSON.stringify({
              aggregatesVersionsMap: [['id1', 3]],
              state: JSON.stringify({ value: 7 }, null, 2),
              cursor: 'CURSOR-CURSOR-CURSOR'
            })
          )

          events = [
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3
              }
            }
          ]

          const stateId2 = await query.readAndSerialize({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {}
          })

          expect(stateId2).toEqual(
            JSON.stringify(
              {
                value: 4
              },
              null,
              2
            )
          )

          expect(eventstoreAdapter.loadSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2'
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 1]],
              state: JSON.stringify({ value: 5 }, null, 2),
              cursor: 'CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 2]],
              state: JSON.stringify({ value: 7 }, null, 2),
              cursor: 'CURSOR-CURSOR'
            })
          )
          expect(eventstoreAdapter.saveSnapshot).toBeCalledWith(
            'VM;viewModelName-invariantHash;id2',
            JSON.stringify({
              aggregatesVersionsMap: [['id2', 3]],
              state: JSON.stringify({ value: 4 }, null, 2),
              cursor: 'CURSOR-CURSOR-CURSOR'
            })
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

        test('"readAndSerialize" should raise error when aggregateIds is a bad value', async () => {
          try {
            await query.readAndSerialize({
              modelName: 'viewModelName',
              aggregateIds: Symbol('BAD_VALUE'),
              aggregateArgs: {}
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

        test('"readAndSerialize" should raise error when query is disposed', async () => {
          await query.dispose()
          try {
            await query.readAndSerialize({
              modelName: 'viewModelName',
              aggregateIds: 'id1',
              aggregateArgs: {}
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

        test('"updateByEvents" should raise error on view models', async () => {
          try {
            await query.updateByEvents({ modelName: 'viewModelName', events })
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

        test('"updateByEvents" should raise error when query is disposed', async () => {
          await query.dispose()
          try {
            await query.updateByEvents({ modelName: 'viewModelName', events })

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
          try {
            await query.drop('viewModelName')
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
          await query.dispose()
          try {
            await query.updateByEvents({ modelName: 'viewModelName', events })

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
          await query.dispose('viewModelName')

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
            readModelConnectors,
            readModels,
            viewModels,
            eventstoreAdapter,
            performanceTracer
          })
        })

        afterEach(() => {
          query = null
        })

        test('"read" should return state', async () => {
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const stateId1 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          expect(stateId1).toEqual({
            value: 7
          })

          events = [
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3
              }
            }
          ]

          const stateId2 = await query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {}
          })

          expect(stateId2).toEqual({
            value: 4
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
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const state1Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          const state2Promise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
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

        test('"read" should raise error when interrupted', async () => {
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const statePromise = query.read({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          await query.dispose('viewModelName')

          try {
            await statePromise

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
          await query.dispose()
          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: 'id1',
              aggregateArgs: {}
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
          try {
            await query.read({
              modelName: 'viewModelName',
              aggregateIds: Symbol('BAD_VALUE'),
              aggregateArgs: {}
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

        test('"readAndSerialize" should return serialized state', async () => {
          events = [
            {
              aggregateId: 'id1',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'ADD',
              payload: {
                value: 10
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 2,
              timestamp: 2,
              type: 'ADD',
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id1',
              aggregateVersion: 3,
              timestamp: 3,
              type: 'SUB',
              payload: {
                value: 8
              }
            }
          ]

          const stateId1 = await query.readAndSerialize({
            modelName: 'viewModelName',
            aggregateIds: 'id1',
            aggregateArgs: {}
          })

          expect(stateId1).toEqual(
            JSON.stringify(
              {
                value: 7
              },
              null,
              2
            )
          )

          events = [
            {
              aggregateId: 'id2',
              type: 'ADD',
              aggregateVersion: 1,
              timestamp: 4,
              payload: {
                value: 5
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 2,
              timestamp: 5,
              type: 'ADD',
              payload: {
                value: 2
              }
            },
            {
              aggregateId: 'id2',
              aggregateVersion: 3,
              timestamp: 6,
              type: 'SUB',
              payload: {
                value: 3
              }
            }
          ]

          const stateId2 = await query.readAndSerialize({
            modelName: 'viewModelName',
            aggregateIds: 'id2',
            aggregateArgs: {}
          })

          expect(stateId2).toEqual(
            JSON.stringify(
              {
                value: 4
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

        test('"readAndSerialize" should raise error when aggregateIds is a bad value', async () => {
          try {
            await query.readAndSerialize({
              modelName: 'viewModelName',
              aggregateIds: Symbol('BAD_VALUE'),
              aggregateArgs: {}
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

        test('"readAndSerialize" should raise error when query is disposed', async () => {
          await query.dispose()
          try {
            await query.readAndSerialize({
              modelName: 'viewModelName',
              aggregateIds: 'id1',
              aggregateArgs: {}
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

        test('"updateByEvents" should raise error on view models', async () => {
          try {
            await query.updateByEvents({ modelName: 'viewModelName', events })
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

        test('"updateByEvents" should raise error when disposed', async () => {
          await query.dispose()
          try {
            await query.updateByEvents({ modelName: 'viewModelName', events })
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
          try {
            await query.drop('viewModelName')
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
          await query.dispose()
          try {
            await query.drop('viewModelName')
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
          await query.dispose('viewModelName')

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
      const remoteReadModelStore: { [key: string]: any } = {}
      beforeEach(() => {
        readModels = [
          {
            name: 'readModelName',
            projection: {
              Init: async (store: any) => {
                await store.set('value', 0)
              },
              ADD: async (store: any, event: any) => {
                const value = await store.get('value')
                await store.set('value', value + event.payload.value)
              },
              SUB: async (store: any, event: any) => {
                const value = await store.get('value')
                await store.set('value', value - event.payload.value)
              }
            },
            resolvers: {
              getValue: async (store: any) => {
                return await store.get('value')
              }
            },
            connectorName: 'default',
            invariantHash: 'readModelName-invariantHash'
          },
          {
            name: 'readOnlyReadModelName',
            projection: null,
            resolvers: {
              readFromDatabase: async () => {
                return 42
              }
            },
            connectorName: 'default',
            invariantHash: 'readOnlyReadModelName-invariantHash'
          },
          {
            name: 'brokenReadModelName',
            projection: {
              BROKEN: async (store: any, event: any) => {
                const error = new Error('BROKEN')
                Object.assign(error, { store, event })
                throw error
              }
            },
            resolvers: {},
            connectorName: 'empty',
            invariantHash: 'brokenReadModelName-invariantHash'
          },
          {
            name: 'remoteReadModelName',
            projection: {
              SET: async (_: any, event: any) => {
                await new Promise(resolve => setImmediate(resolve))
                remoteReadModelStore[event.payload.key] = event.payload.value
              }
            },
            resolvers: {
              getValue: async (store: any) => {
                return await store.get('value')
              }
            },
            connectorName: 'empty',
            invariantHash: 'remoteReadModelName-invariantHash'
          }
        ]

        readModelConnectors = {
          default: (() => {
            const readModels = new Map()
            const connect = jest
              .fn()
              .mockImplementation(async readModelName => {
                if (!readModels.has(readModelName)) {
                  readModels.set(readModelName, new Map())
                }
                return {
                  get(key: string) {
                    return readModels.get(readModelName).get(key)
                  },
                  set(key: string, value: any) {
                    readModels.get(readModelName).set(key, value)
                  }
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
              dispose
            }
          })(),
          empty: {
            connect: jest.fn(),
            disconnect: jest.fn(),
            drop: jest.fn(),
            dispose: jest.fn()
          }
        }

        query = createQuery({
          readModelConnectors,
          readModels,
          viewModels,
          eventstoreAdapter,
          performanceTracer
        })
      })

      afterEach(() => {
        query = null
      })

      test('"read" should return the resolver result', async () => {
        const value = await query.read({
          modelName: 'readOnlyReadModelName',
          resolverName: 'readFromDatabase',
          resolverArgs: {}
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
        try {
          await query.read({
            modelName: 'notFound',
            resolverName: 'notFound',
            resolverArgs: {}
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

      test('"read" should return { error, ... } when a read model is broken', async () => {
        const events = [
          {
            aggregateId: 'id1',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'BROKEN',
            payload: {}
          }
        ]

        try {
          await query.updateByEvents({
            modelName: 'brokenReadModelName',
            events
          })
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error.error.message).toEqual('BROKEN')
          expect(error.error).toBeInstanceOf(Error)
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
        try {
          await query.read({
            modelName: 'readModelName',
            resolverName: 'notFound',
            resolverArgs: {}
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
        try {
          await query.dispose()
          await query.read({
            modelName: 'readOnlyReadModelName',
            resolverName: 'readFromDatabase',
            resolverArgs: {}
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

      test('"updateByEvents" should apply events to the read model, "read" should return the resolver result', async () => {
        events = [
          {
            type: 'Init'
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'ADD',
            payload: {
              value: 10
            }
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 2,
            timestamp: 2,
            type: 'ADD',
            payload: {
              value: 5
            }
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 3,
            timestamp: 3,
            type: 'SUB',
            payload: {
              value: 8
            }
          },
          {
            aggregateId: 'id1',
            aggregateVersion: 4,
            timestamp: 4,
            type: 'OTHER_EVENT',
            payload: {}
          }
        ]

        const result = await query.updateByEvents({
          modelName: 'readModelName',
          events
        })

        const value = await query.read({
          modelName: 'readModelName',
          resolverName: 'getValue',
          resolverArgs: {}
        })

        expect(value).toEqual(7)
        expect(result).toEqual({
          error: null,
          successEvent: {
            aggregateId: 'id1',
            aggregateVersion: 3,
            timestamp: 3,
            type: 'SUB',
            payload: {
              value: 8
            }
          },
          failedEvent: null,
          eventSubscriber: 'readModelName'
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

      test('"updateByEvents" should raise error when a projection is not found', async () => {
        try {
          await query.updateByEvents({
            modelName: 'readOnlyReadModelName',
            events
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

      test('"updateByEvents" should raise error when events is not array', async () => {
        try {
          await query.updateByEvents({
            modelName: 'readOnlyReadModelName',
            events: null
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

      test('"updateByEvents" should raise error when updating had been interrupted', async () => {
        events = [
          {
            aggregateId: 'id',
            aggregateVersion: 1,
            timestamp: 1,
            type: 'SET',
            payload: {
              key: 1,
              value: 2
            }
          },
          {
            aggregateId: 'id',
            aggregateVersion: 2,
            timestamp: 2,
            type: 'SET',
            payload: {
              key: 3,
              value: 4
            }
          }
        ]

        const result = query.updateByEvents({
          modelName: 'remoteReadModelName',
          events
        })

        await query.dispose()

        try {
          await result
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error.error).toBeInstanceOf(Error)
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

      test('"updateByEvents" should raise error when query is disposed', async () => {
        events = [
          {
            type: 'Init'
          }
        ]

        await query.dispose()

        try {
          await query.updateByEvents({ modelName: 'readModelName', events })
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

      test('"readAndSerialize" should return the resolver result', async () => {
        const value = await query.readAndSerialize({
          modelName: 'readOnlyReadModelName',
          resolverName: 'readFromDatabase',
          resolverArgs: {}
        })

        expect(value).toEqual(JSON.stringify(42, null, 2))

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

      test('"readAndSerialize" should raise error when query is disposed', async () => {
        await query.dispose()

        try {
          await query.readAndSerialize({
            modelName: 'readOnlyReadModelName',
            resolverName: 'readFromDatabase',
            resolverArgs: {}
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

      test('"drop" should drop read model', async () => {
        await query.drop('readModelName')

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
        await query.dispose()

        try {
          await query.drop('readModelName')

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
        await query.dispose('readModelName')

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
                  invariantHash: 'readModelName-invariantHash'
                }
              ],
              viewModels,
              eventstoreAdapter,
              performanceTracer
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
                  dispose: jest.fn()
                }
              },
              readModels: [
                {
                  name: 'readModelName',
                  projection: {},
                  resolvers: {},
                  connectorName: 'empty',
                  invariantHash: 'readModelName-invariantHash'
                },
                {
                  name: 'readModelName',
                  projection: {},
                  resolvers: {},
                  connectorName: 'empty',
                  invariantHash: 'readModelName-invariantHash'
                }
              ],
              viewModels,
              eventstoreAdapter,
              performanceTracer
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
                  invariantHash: 'viewModelName-invariantHash'
                },
                {
                  name: 'viewModelName',
                  projection: {},
                  invariantHash: 'viewModelName-invariantHash'
                }
              ],
              eventstoreAdapter,
              performanceTracer
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
              invariantHash: 'viewModelName-invariantHash'
            }
          ],
          eventstoreAdapter,
          performanceTracer
        })

        try {
          await query.read({
            modelName: 'viewModelName',
            wrongArg1: '1',
            wrongArg2: '2'
          })
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error.message).toEqual('Wrong options for read invocation')
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
  })
}
