import createQuery from '../src/index'

let events,
  eventStore,
  snapshots,
  snapshotAdapter,
  viewModels,
  readModels,
  readModelConnectors,
  doUpdateRequest

beforeEach(() => {
  events = []
  eventStore = {
    loadEvents: async (filter, handler) => {
      for (const event of events) {
        if (
          filter.aggregateIds != null &&
          !filter.aggregateIds.includes(event.aggregateId)
        ) {
          continue
        }
        if (event.timestamp <= filter.startTime + 1) {
          continue
        }
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
})

afterEach(() => {
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
        name: 'correctViewModelWithInit',
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
        invariantHash: 'correctViewModelWithInit-invariantHash'
      }
    ]

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
  })

  describe('with snapshot adapter', () => {
    let query = null

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
        eventStore
      })
    })

    afterEach(() => {
      query = null
      snapshotAdapter = null
    })

    test('"read" should return state', async () => {
      const stateId1 = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      expect(stateId1).toEqual({
        value: 7
      })

      expect(snapshotAdapter.loadSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1'
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1',
        {
          aggregatesVersionsMap: [['id1', 1]],
          lastTimestamp: 0,
          state: JSON.stringify({ value: 10 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1',
        {
          aggregatesVersionsMap: [['id1', 2]],
          lastTimestamp: 1,
          state: JSON.stringify({ value: 15 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1',
        {
          aggregatesVersionsMap: [['id1', 3]],
          lastTimestamp: 2,
          state: JSON.stringify({ value: 7 }, null, 2)
        }
      )

      const stateId2 = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id2',
        aggregateArgs: {}
      })

      expect(stateId2).toEqual({
        value: 4
      })

      expect(snapshotAdapter.loadSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2'
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2',
        {
          aggregatesVersionsMap: [['id2', 1]],
          lastTimestamp: 3,
          state: JSON.stringify({ value: 5 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2',
        {
          aggregatesVersionsMap: [['id2', 2]],
          lastTimestamp: 4,
          state: JSON.stringify({ value: 7 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2',
        {
          aggregatesVersionsMap: [['id2', 3]],
          lastTimestamp: 5,
          state: JSON.stringify({ value: 4 }, null, 2)
        }
      )

      const stateId2Second = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id2',
        aggregateArgs: {}
      })

      expect(stateId2Second).toEqual(stateId2)

      const stateWildcard = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: '*',
        aggregateArgs: {}
      })

      expect(stateWildcard).toEqual({ value: 11 })

      const stateId1AndId2 = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1,id2',
        aggregateArgs: {}
      })

      expect(stateId1AndId2).toEqual({ value: 11 })
    })

    test('"read" should reuse working build process', async () => {
      const state1Promise = query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      const state2Promise = query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      expect(state1Promise).toEqual(state2Promise)

      await state1Promise
      await state2Promise
    })

    test('"read" should raise error when interrupted', async () => {
      const statePromise = query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      await query.dispose('correctViewModelWithInit')

      try {
        await statePromise

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"read" should raise error when aggregateIds is a bad value', async () => {
      try {
        await query.read({
          modelName: 'correctViewModelWithInit',
          aggregateIds: Symbol('BAD_VALUE'),
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"read" should raise error when query is disposed', async () => {
      await query.dispose()
      try {
        await query.read({
          modelName: 'correctViewModelWithInit',
          aggregateIds: 'id1',
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"readAndSerialize" should return serialized state', async () => {
      const stateId1 = await query.readAndSerialize({
        modelName: 'correctViewModelWithInit',
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
        'correctViewModelWithInit-invariantHash;id1'
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1',
        {
          aggregatesVersionsMap: [['id1', 1]],
          lastTimestamp: 0,
          state: JSON.stringify({ value: 10 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1',
        {
          aggregatesVersionsMap: [['id1', 2]],
          lastTimestamp: 1,
          state: JSON.stringify({ value: 15 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id1',
        {
          aggregatesVersionsMap: [['id1', 3]],
          lastTimestamp: 2,
          state: JSON.stringify({ value: 7 }, null, 2)
        }
      )

      const stateId2 = await query.readAndSerialize({
        modelName: 'correctViewModelWithInit',
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
        'correctViewModelWithInit-invariantHash;id2'
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2',
        {
          aggregatesVersionsMap: [['id2', 1]],
          lastTimestamp: 3,
          state: JSON.stringify({ value: 5 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2',
        {
          aggregatesVersionsMap: [['id2', 2]],
          lastTimestamp: 4,
          state: JSON.stringify({ value: 7 }, null, 2)
        }
      )
      expect(snapshotAdapter.saveSnapshot).toBeCalledWith(
        'correctViewModelWithInit-invariantHash;id2',
        {
          aggregatesVersionsMap: [['id2', 3]],
          lastTimestamp: 5,
          state: JSON.stringify({ value: 4 }, null, 2)
        }
      )
    })

    test('"readAndSerialize" should raise error when aggregateIds is a bad value', async () => {
      try {
        await query.readAndSerialize({
          modelName: 'correctViewModelWithInit',
          aggregateIds: Symbol('BAD_VALUE'),
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"readAndSerialize" should raise error when query is disposed', async () => {
      await query.dispose()
      try {
        await query.readAndSerialize({
          modelName: 'correctViewModelWithInit',
          aggregateIds: 'id1',
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"updateByEvents" should raise error on view models', async () => {
      try {
        await query.updateByEvents('correctViewModelWithInit', events)
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
      expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
    })

    test('"updateByEvents" should raise error when query is disposed', async () => {
      await query.dispose()
      try {
        await query.updateByEvents('correctViewModelWithInit', events)

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"drop" should raise error on view models', async () => {
      try {
        await query.drop('correctViewModelWithInit')
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
      expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
    })

    test('"drop" should raise error when query is disposed', async () => {
      await query.dispose()
      try {
        await query.updateByEvents('correctViewModelWithInit', events)

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"dispose" should dispose only one time', async () => {
      await query.dispose('correctViewModelWithInit')

      try {
        await query.dispose()
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
      expect(snapshotAdapter.loadSnapshot).not.toBeCalled()
    })
  })

  describe('without snapshot adapter', () => {
    let query = null

    beforeEach(() => {
      query = createQuery({
        readModelConnectors,
        snapshotAdapter: null,
        doUpdateRequest,
        readModels,
        viewModels,
        eventStore
      })
    })

    afterEach(() => {
      query = null
    })

    test('"read" should return state', async () => {
      const stateId1 = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      expect(stateId1).toEqual({
        value: 7
      })

      const stateId2 = await query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id2',
        aggregateArgs: {}
      })

      expect(stateId2).toEqual({
        value: 4
      })
    })

    test('"read" should reuse working build process', async () => {
      const state1Promise = query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      const state2Promise = query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      expect(state1Promise).toEqual(state2Promise)

      await state1Promise
      await state2Promise
    })

    test('"read" should raise error when interrupted', async () => {
      const statePromise = query.read({
        modelName: 'correctViewModelWithInit',
        aggregateIds: 'id1',
        aggregateArgs: {}
      })

      await query.dispose('correctViewModelWithInit')

      try {
        await statePromise

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"read" should raise error when query is disposed', async () => {
      await query.dispose()
      try {
        await query.read({
          modelName: 'correctViewModelWithInit',
          aggregateIds: 'id1',
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"read" should raise error when aggregateIds is a bad value', async () => {
      try {
        await query.read({
          modelName: 'correctViewModelWithInit',
          aggregateIds: Symbol('BAD_VALUE'),
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"readAndSerialize" should return serialized state', async () => {
      const stateId1 = await query.readAndSerialize({
        modelName: 'correctViewModelWithInit',
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

      const stateId2 = await query.readAndSerialize({
        modelName: 'correctViewModelWithInit',
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
    })

    test('"readAndSerialize" should raise error when aggregateIds is a bad value', async () => {
      try {
        await query.readAndSerialize({
          modelName: 'correctViewModelWithInit',
          aggregateIds: Symbol('BAD_VALUE'),
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"readAndSerialize" should raise error when query is disposed', async () => {
      await query.dispose()
      try {
        await query.readAndSerialize({
          modelName: 'correctViewModelWithInit',
          aggregateIds: 'id1',
          aggregateArgs: {}
        })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"updateByEvents" should raise error on view models', async () => {
      try {
        await query.updateByEvents('correctViewModelWithInit', events)
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"updateByEvents" should raise error when disposed', async () => {
      await query.dispose()
      try {
        await query.updateByEvents('correctViewModelWithInit', events)
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"drop" should raise error on view-model', async () => {
      try {
        await query.drop('correctViewModelWithInit')
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"drop" should raise error when disposed', async () => {
      await query.dispose()
      try {
        await query.drop('correctViewModelWithInit')
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('"dispose" should dispose only one time', async () => {
      await query.dispose('correctViewModelWithInit')

      try {
        await query.dispose()
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})
