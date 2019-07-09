import createCommandExecutor from '../src'
import { CommandError } from '../src'

let eventStore, events, snapshotAdapter, DateNow, performanceTracer

beforeEach(() => {
  events = []

  eventStore = {
    loadEvents: jest.fn().mockImplementation(async (filter, handler) => {
      for (const event of events) {
        await handler(event)
      }
    }),
    saveEvent: jest.fn().mockImplementation(async event => {
      events.push(event)
      return event
    })
  }

  DateNow = Date.now
  const timestamp = Date.now()
  global.Date.now = jest.fn().mockReturnValue(timestamp)

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
})

afterEach(() => {
  eventStore = null
  events = null
  snapshotAdapter = null
  global.Date.now = DateNow
  performanceTracer = null
})

describe('executeCommand', () => {
  describe('without performance tracer', () => {
    test('should success build aggregate state from empty event list and execute cmd', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      const event = await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand'
      })

      expect(event.aggregateVersion).toEqual(1)
    })

    test('should success build aggregate state and execute command', async () => {
      const aggregate = {
        name: 'Entity',
        commands: {
          create: state => {
            if (state.created) {
              throw new Error('Entity already created')
            }
            return {
              type: 'CREATED'
            }
          }
        },
        projection: {
          Init: () => {
            return {
              created: false
            }
          },
          CREATED: state => {
            return {
              ...state,
              created: true
            }
          }
        },
        invariantHash: 'Entity-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      await executeCommand({
        aggregateName: 'Entity',
        aggregateId: 'aggregateId',
        type: 'create'
      })

      try {
        await executeCommand({
          aggregateName: 'Entity',
          aggregateId: 'aggregateId',
          type: 'create'
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Entity already created')
      }
    })

    test('should pass security context to command handler', async () => {
      const JWT_TOKEN = Buffer.from('ROOT', 'utf8').toString('base64')

      const aggregate = {
        name: 'User',
        commands: {
          createUser: (aggregateState, command, jwtToken) => {
            if (Buffer.from(jwtToken, 'base64').toString('utf8') !== 'ROOT') {
              throw new Error('Access denied')
            }

            return {
              type: 'USER_CREATED',
              payload: {
                id: command.payload.id
              }
            }
          }
        },
        invariantHash: 'User-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      const event = await executeCommand({
        aggregateName: 'User',
        aggregateId: 'aggregateId',
        type: 'createUser',
        payload: {
          id: 'userId'
        },
        jwtToken: JWT_TOKEN
      })

      expect(event).toEqual({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        type: 'USER_CREATED',
        payload: {
          id: 'userId'
        },
        timestamp: Date.now()
      })

      try {
        await executeCommand({
          aggregateName: 'User',
          aggregateId: 'aggregateId',
          type: 'createUser',
          payload: {
            id: 'userId'
          },
          jwtToken: 'INCORRECT_JWT_TOKEN'
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Access denied')
      }
    })

    test('should use snapshotAdapter for building state', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key2',
          value: 'value2'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(1)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(2)
      expect(events.length).toEqual(2)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key3',
          value: 'value3'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(2)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(3)
      expect(events.length).toEqual(3)
    })

    test('should throw error when use snapshot adapter without invariant hash', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState)
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          `Field "invariantHash" is required and must be a string when using aggregate snapshots`
        )
      }
    })

    test('should throw error when use snapshot adapter with incorrect invariant hash', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 42
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          `Field "invariantHash" is required and must be a string when using aggregate snapshots`
        )
      }
    })

    test('should throw error when the incorrect order of events', async () => {
      events = [
        {
          aggregateId: 'aggregateId',
          aggregateVersion: 2,
          eventType: 'SET',
          timestamp: 2,
          payload: {
            key: 'key',
            value: 'value'
          }
        },
        {
          aggregateId: 'aggregateId',
          aggregateVersion: 1,
          eventType: 'SET',
          timestamp: 1,
          payload: {
            key: 'key',
            value: 'value'
          }
        }
      ]

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key',
            value: 'value'
          }
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          `Incorrect order of events by aggregateId = "aggregateId"`
        )
      }
    })

    test('should throw error when unknown command', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'unknownCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
      }
    })

    test('should throw error when the aggregateId is not a string', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 42,
          type: 'unknownCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          'The "aggregateId" argument must be a string'
        )
      }
    })

    test('should throw error when the aggregateName is not a string', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 42,
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          'The "aggregateName" argument must be a string'
        )
      }
    })

    test('should throw error when the type is not a string', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 42
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('The "type" argument must be a string')
      }
    })

    test('should throw error when an aggregate does not exist', async () => {
      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: []
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Aggregate "empty" does not exist')
      }
    })

    test('should throw error when an event contains "aggregateId", "aggregateVersion", "timestamp" fields', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},

              aggregateId: 'aggregateId',
              aggregateVersion: 'aggregateVersion',
              timestamp: 'timestamp'
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          'Event should not contain "aggregateId", "aggregateVersion", "timestamp" fields'
        )
      }
    })

    test('should throw error when an event does not contain "type" field', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Event "type" is required')
      }
    })
  })

  describe('with performance tracer', () => {
    test('should success build aggregate state from empty event list and execute cmd', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      const event = await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand'
      })

      expect(event.aggregateVersion).toEqual(1)

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should success build aggregate state and execute command', async () => {
      const aggregate = {
        name: 'Entity',
        commands: {
          create: state => {
            if (state.created) {
              throw new Error('Entity already created')
            }
            return {
              type: 'CREATED'
            }
          }
        },
        projection: {
          Init: () => {
            return {
              created: false
            }
          },
          CREATED: state => {
            return {
              ...state,
              created: true
            }
          }
        },
        invariantHash: 'Entity-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      await executeCommand({
        aggregateName: 'Entity',
        aggregateId: 'aggregateId',
        type: 'create'
      })

      try {
        await executeCommand({
          aggregateName: 'Entity',
          aggregateId: 'aggregateId',
          type: 'create'
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Entity already created')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should pass security context to command handler', async () => {
      const JWT_TOKEN = Buffer.from('ROOT', 'utf8').toString('base64')

      const aggregate = {
        name: 'User',
        commands: {
          createUser: (aggregateState, command, jwtToken) => {
            if (Buffer.from(jwtToken, 'base64').toString('utf8') !== 'ROOT') {
              throw new Error('Access denied')
            }

            return {
              type: 'USER_CREATED',
              payload: {
                id: command.payload.id
              }
            }
          }
        },
        invariantHash: 'User-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      const event = await executeCommand({
        aggregateName: 'User',
        aggregateId: 'aggregateId',
        type: 'createUser',
        payload: {
          id: 'userId'
        },
        jwtToken: JWT_TOKEN
      })

      expect(event).toEqual({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        type: 'USER_CREATED',
        payload: {
          id: 'userId'
        },
        timestamp: Date.now()
      })

      try {
        await executeCommand({
          aggregateName: 'User',
          aggregateId: 'aggregateId',
          type: 'createUser',
          payload: {
            id: 'userId'
          },
          jwtToken: 'INCORRECT_JWT_TOKEN'
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Access denied')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should use snapshotAdapter for building state', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter,
        performanceTracer
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key2',
          value: 'value2'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(1)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(2)
      expect(events.length).toEqual(2)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key3',
          value: 'value3'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(2)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(3)
      expect(events.length).toEqual(3)

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when use snapshot adapter without invariant hash', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState)
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter,
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          `Field "invariantHash" is required and must be a string when using aggregate snapshots`
        )
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when use snapshot adapter with incorrect invariant hash', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 42
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter,
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          `Field "invariantHash" is required and must be a string when using aggregate snapshots`
        )
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when the incorrect order of events', async () => {
      events = [
        {
          aggregateId: 'aggregateId',
          aggregateVersion: 2,
          eventType: 'SET',
          timestamp: 2,
          payload: {
            key: 'key',
            value: 'value'
          }
        },
        {
          aggregateId: 'aggregateId',
          aggregateVersion: 1,
          eventType: 'SET',
          timestamp: 1,
          payload: {
            key: 'key',
            value: 'value'
          }
        }
      ]

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter,
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key',
            value: 'value'
          }
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          `Incorrect order of events by aggregateId = "aggregateId"`
        )
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when unknown command', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate]
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'unknownCommand',
          performanceTracer
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when the aggregateId is not a string', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 42,
          type: 'unknownCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          'The "aggregateId" argument must be a string'
        )
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when the aggregateName is not a string', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 42,
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          'The "aggregateName" argument must be a string'
        )
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when the type is not a string', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 42
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('The "type" argument must be a string')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when an aggregate does not exist', async () => {
      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [],
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Aggregate "empty" does not exist')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when an event contains "aggregateId", "aggregateVersion", "timestamp" fields', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},

              aggregateId: 'aggregateId',
              aggregateVersion: 'aggregateVersion',
              timestamp: 'timestamp'
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual(
          'Event should not contain "aggregateId", "aggregateVersion", "timestamp" fields'
        )
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should throw error when an event does not contain "type" field', async () => {
      const aggregate = {
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              payload: {}
            }
          }
        },
        invariantHash: 'empty-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        performanceTracer
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand'
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Event "type" is required')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })
  })
})

describe('dispose', () => {
  describe('without performance tracer', () => {
    test('should dispose the command executor', async () => {
      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: []
      })

      await executeCommand.dispose()

      try {
        await executeCommand.dispose()

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }
    })

    test('should dispose the snapshot handler', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand.dispose()

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key2',
            value: 'value2'
          }
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }
    })

    test('should dispose the regular handler', async () => {
      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(events.length).toEqual(1)

      await executeCommand.dispose()

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key2',
            value: 'value2'
          }
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }
    })
  })

  describe('with performance tracer', () => {
    test('should dispose the command executor', async () => {
      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [],
        performanceTracer
      })

      await executeCommand.dispose()

      try {
        await executeCommand.dispose()

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should dispose the snapshot handler', async () => {
      const snapshots = new Map()
      snapshotAdapter = {
        saveSnapshot: jest.fn().mockImplementation((key, value) => {
          return snapshots.set(key, value)
        }),
        loadSnapshot: jest.fn().mockImplementation(key => {
          return snapshots.get(key)
        })
      }

      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter,
        performanceTracer
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(snapshotAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(snapshotAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand.dispose()

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key2',
            value: 'value2'
          }
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })

    test('should dispose the regular handler', async () => {
      const aggregate = {
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value
              }
            }
          }
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value]
            }
          }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: serializedState => JSON.parse(serializedState),
        invariantHash: 'Map-invariantHash'
      }

      const executeCommand = createCommandExecutor({
        eventStore,
        aggregates: [aggregate],
        snapshotAdapter,
        performanceTracer
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(events.length).toEqual(1)

      await executeCommand.dispose()

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key2',
            value: 'value2'
          }
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }

      expect(performanceTracer.getSegment.mock.calls).toMatchSnapshot(
        'getSegment'
      )
      expect(performanceTracer.addNewSubsegment.mock.calls).toMatchSnapshot(
        'addNewSubsegment'
      )
      expect(performanceTracer.addAnnotation.mock.calls).toMatchSnapshot(
        'addAnnotation'
      )
      expect(performanceTracer.addError.mock.calls).toMatchSnapshot('addError')
      expect(performanceTracer.close.mock.calls).toMatchSnapshot('close')
    })
  })
})
