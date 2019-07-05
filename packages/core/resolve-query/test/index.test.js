import createQuery from '../src/index'

let events,
  eventStore,
  snapshots,
  snapshotAdapter,
  viewModels,
  readModels,
  readModelConnectors,
  doUpdateRequest,
  query,
  performanceTracer

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
      eventStore = {
        loadEvents: async (filter, handler) => {
          for (const event of events) {
            await handler(event)
          }
        }
      }

      snapshots = new Map()
      snapshotAdapter = null

      viewModels = []
      readModels = []
      readModelConnectors = {}

      doUpdateRequest = async () => {}

      prepare()
    })

    afterEach(() => {
      query = null
      events = null
      eventStore = null
      snapshots = null
      snapshotAdapter = null
      viewModels = null
      readModels = null
      readModelConnectors = null
      doUpdateRequest = null
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
              ADD: (state, event) => {
                return {
                  ...state,
                  value: state.value + event.payload.value
                }
              },
              SUB: (state, event) => {
                return {
                  ...state,
                  value: state.value - event.payload.value
                }
              }
            },
            serializeState: async state => {
              return JSON.stringify(state, null, 2)
            },
            deserializeState: async serializedState => {
              return JSON.parse(serializedState)
            },
            invariantHash: 'viewModelName-invariantHash'
          }
        ]
      })

      describe('with snapshot adapter', () => {
        query = null

        beforeEach(() => {
          snapshotAdapter = {
            loadSnapshot: jest.fn().mockImplementation(async key => {
              return snapshots.get(key)
            }),
            saveSnapshot: jest.fn().mockImplementation(async (key, value) => {
              snapshots.set(key, value)
            })
          }

          query = createQuery({
            readModelConnectors,
            snapshotAdapter,
            doUpdateRequest,
            readModels,
            viewModels,
            eventStore,
            performanceTracer
          })
        })

        afterEach(() => {
          query = null
          snapshotAdapter = null
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

          expect(snapshotAdapter.loadSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1'
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1',
            {
              aggregatesVersionsMap: [['id1', 1]],
              lastTimestamp: 0,
              state: JSON.stringify({ value: 10 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1',
            {
              aggregatesVersionsMap: [['id1', 2]],
              lastTimestamp: 1,
              state: JSON.stringify({ value: 15 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1',
            {
              aggregatesVersionsMap: [['id1', 3]],
              lastTimestamp: 2,
              state: JSON.stringify({ value: 7 }, null, 2)
            }
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

          expect(snapshotAdapter.loadSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2'
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2',
            {
              aggregatesVersionsMap: [['id2', 1]],
              lastTimestamp: 3,
              state: JSON.stringify({ value: 5 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2',
            {
              aggregatesVersionsMap: [['id2', 2]],
              lastTimestamp: 4,
              state: JSON.stringify({ value: 7 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2',
            {
              aggregatesVersionsMap: [['id2', 3]],
              lastTimestamp: 5,
              state: JSON.stringify({ value: 4 }, null, 2)
            }
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

          expect(snapshotAdapter.loadSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1'
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1',
            {
              aggregatesVersionsMap: [['id1', 1]],
              lastTimestamp: 0,
              state: JSON.stringify({ value: 10 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1',
            {
              aggregatesVersionsMap: [['id1', 2]],
              lastTimestamp: 1,
              state: JSON.stringify({ value: 15 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id1',
            {
              aggregatesVersionsMap: [['id1', 3]],
              lastTimestamp: 2,
              state: JSON.stringify({ value: 7 }, null, 2)
            }
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

          expect(snapshotAdapter.loadSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2'
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2',
            {
              aggregatesVersionsMap: [['id2', 1]],
              lastTimestamp: 3,
              state: JSON.stringify({ value: 5 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2',
            {
              aggregatesVersionsMap: [['id2', 2]],
              lastTimestamp: 4,
              state: JSON.stringify({ value: 7 }, null, 2)
            }
          )
          expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
            'viewModelName-invariantHash;id2',
            {
              aggregatesVersionsMap: [['id2', 3]],
              lastTimestamp: 5,
              state: JSON.stringify({ value: 4 }, null, 2)
            }
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
            await query.updateByEvents('viewModelName', events)
            return Promise.reject(new Error('Test failed'))
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
          }

          expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
          expect(snapshotAdapter.loadSnapshot).not.toBeCalled()

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
            await query.updateByEvents('viewModelName', events)

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

          expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
          expect(snapshotAdapter.loadSnapshot).not.toBeCalled()

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
            await query.updateByEvents('viewModelName', events)

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

          expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
          expect(snapshotAdapter.loadSnapshot).not.toBeCalled()

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

      describe('without snapshot adapter', () => {
        query = null

        beforeEach(() => {
          query = createQuery({
            readModelConnectors,
            snapshotAdapter: null,
            doUpdateRequest,
            readModels,
            viewModels,
            eventStore,
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
            await query.updateByEvents('viewModelName', events)
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
            await query.updateByEvents('viewModelName', events)
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
      const remoteReadModelStore = {}
      beforeEach(() => {
        readModels = [
          {
            name: 'readModelName',
            projection: {
              Init: async store => {
                await store.set('value', 0)
              },
              ADD: async (store, event) => {
                const value = await store.get('value')
                await store.set('value', value + event.payload.value)
              },
              SUB: async (store, event) => {
                const value = await store.get('value')
                await store.set('value', value - event.payload.value)
              }
            },
            resolvers: {
              getValue: async store => {
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
              BROKEN: async (store, event) => {
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
              SET: async (_, event) => {
                await new Promise(resolve => setImmediate(resolve))
                remoteReadModelStore[event.payload.key] = event.payload.value
              }
            },
            resolvers: {
              getValue: async store => {
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
                  get(key) {
                    return readModels.get(readModelName).get(key)
                  },
                  set(key, value) {
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
          snapshotAdapter,
          doUpdateRequest,
          readModels,
          viewModels,
          eventStore,
          performanceTracer
        })

        doUpdateRequest = async readModelName => {
          await query.updateByEvents(readModelName, events)
        }
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

      test('"read" should return { lastError, ... } when a read model is broken', async () => {
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
          await query.updateByEvents('brokenReadModelName', events)
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error.lastError.message).toEqual('BROKEN')
          expect(error.lastError).toBeInstanceOf(Error)
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

        const result = await query.updateByEvents('readModelName', events)

        const value = await query.read({
          modelName: 'readModelName',
          resolverName: 'getValue',
          resolverArgs: {}
        })

        expect(value).toEqual(7)
        expect(result).toEqual({
          lastError: null,
          lastEvent: {
            aggregateId: 'id1',
            aggregateVersion: 3,
            timestamp: 3,
            type: 'SUB',
            payload: {
              value: 8
            }
          },
          listenerId: 'readModelName'
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
          await query.updateByEvents('readOnlyReadModelName', events)
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
          await query.updateByEvents('readOnlyReadModelName', null)
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

        const result = query.updateByEvents('remoteReadModelName', events)

        await query.dispose()

        try {
          await result
          return Promise.reject(new Error('Test failed'))
        } catch (error) {
          expect(error.lastError).toBeInstanceOf(Error)
          expect(error.lastError.message).toEqual(
            'Read model "remoteReadModelName" updating had been interrupted'
          )
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
          await query.updateByEvents('readModelName', events)
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
              snapshotAdapter,
              doUpdateRequest,
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
              eventStore,
              performanceTracer
            }))
        ).toThrow(
          'Connector "default" for read-model "readModelName" does not exist'
        )
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
              snapshotAdapter,
              doUpdateRequest,
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
              eventStore,
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
              snapshotAdapter,
              doUpdateRequest,
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
              eventStore,
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
          snapshotAdapter,
          doUpdateRequest,
          readModels,
          viewModels: [
            {
              name: 'viewModelName',
              projection: {},
              invariantHash: 'viewModelName-invariantHash'
            }
          ],
          eventStore,
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
