import createCommandExecutor from '../src'
import { CommandError } from '../src'

let eventstoreAdapter: any
let onCommandExecuted: any
let events: any
let DateNow: any
let performanceTracer: any
let snapshots: any

const dummyEncryption = () => Promise.resolve({})

const makeAggregateMeta = (params: any) => ({
  encryption: params.encryption || dummyEncryption,
  name: params.name || 'empty',
  commands: params.commands || {},
  invariantHash:
    params.invariantHash || Object.keys(params).includes('invariantHash')
      ? params.invariantHash
      : 'empty-invariantHash',
  serializeState: params.serializeState || JSON.stringify,
  deserializeState: params.deserializeState || JSON.parse,
  projection: params.projection || {},
})

beforeEach(() => {
  events = []
  snapshots = new Map()

  eventstoreAdapter = {
    loadEvents: jest.fn().mockImplementation(async ({ cursor: prevCursor }) => {
      return {
        cursor: `${prevCursor == null ? '' : prevCursor}${events
          .map((e: any) => Buffer.from(JSON.stringify(e)).toString('base64'))
          .join(',')}`,
        events:
          prevCursor != null
            ? `${events.map((e: any) =>
                Buffer.from(JSON.stringify(e)).toString('base64')
              )}`
                .substr(prevCursor.length)
                .split(',')
                .filter((e) => e != null && e.length > 0)
                .map((e) => JSON.parse(Buffer.from(e, 'base64').toString()))
            : events,
      }
    }),
    getNextCursor: jest.fn().mockImplementation((prevCursor, events) => {
      return `${prevCursor == null ? '' : prevCursor}${events
        .map((e: any) => Buffer.from(JSON.stringify(e)).toString('base64'))
        .join(',')}`
    }),
    getSecretsManager: jest.fn(),
    saveSnapshot: jest.fn().mockImplementation((key, value) => {
      return snapshots.set(key, value)
    }),
    loadSnapshot: jest.fn().mockImplementation((key) => {
      return snapshots.get(key)
    }),
  }

  onCommandExecuted = jest.fn().mockImplementation(async (event) => {
    events.push(event)
    return event
  })

  DateNow = Date.now
  const timestamp = Date.now()
  global.Date.now = jest.fn().mockReturnValue(timestamp)

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
})

afterEach(() => {
  eventstoreAdapter = null
  events = null
  global.Date.now = DateNow
  performanceTracer = null
  onCommandExecuted = null
  snapshots = null
})

describe('executeCommand', () => {
  describe('without performance tracer', () => {
    test('should success build aggregate state from empty event list and execute cmd', async () => {
      const aggregate = makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      const event = await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand',
      })

      expect(event.aggregateVersion).toEqual(1)
    })

    test('should success build aggregate state and execute command', async () => {
      const aggregate = makeAggregateMeta({
        name: 'Entity',
        commands: {
          create: (state: any) => {
            if (state.created) {
              throw new Error('Entity already created')
            }
            return {
              type: 'CREATED',
            }
          },
        },
        projection: {
          Init: () => {
            return {
              created: false,
            }
          },
          CREATED: (state: any) => {
            return {
              ...state,
              created: true,
            }
          },
        },
        invariantHash: 'Entity-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      await executeCommand({
        aggregateName: 'Entity',
        aggregateId: 'aggregateId',
        type: 'create',
      })

      try {
        await executeCommand({
          aggregateName: 'Entity',
          aggregateId: 'aggregateId',
          type: 'create',
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Entity already created')
      }
    })

    test('should pass security context to command handler', async () => {
      const JWT_TOKEN = Buffer.from('ROOT', 'utf8').toString('base64')

      const aggregate = makeAggregateMeta({
        name: 'User',
        commands: {
          createUser: (
            aggregateState: any,
            command: any,
            { jwt }: { jwt: string }
          ) => {
            if (Buffer.from(jwt, 'base64').toString('utf8') !== 'ROOT') {
              throw new Error('Access denied')
            }

            return {
              type: 'USER_CREATED',
              payload: {
                id: command.payload.id,
              },
            }
          },
        },
        invariantHash: 'User-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      const event = await executeCommand({
        aggregateName: 'User',
        aggregateId: 'aggregateId',
        type: 'createUser',
        payload: {
          id: 'userId',
        },
        jwt: JWT_TOKEN,
      })

      expect(event).toEqual({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        type: 'USER_CREATED',
        payload: {
          id: 'userId',
        },
        timestamp: Date.now(),
      })

      try {
        await executeCommand({
          aggregateName: 'User',
          aggregateId: 'aggregateId',
          type: 'createUser',
          payload: {
            id: 'userId',
          },
          jwt: 'INCORRECT_JWT_TOKEN',
        })
        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Access denied')
      }
    })

    test('should use snapshots for building state', async () => {
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key2',
          value: 'value2',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(1)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(2)
      expect(events.length).toEqual(2)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key3',
          value: 'value3',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(2)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(3)
      expect(events.length).toEqual(3)
    })

    test('should throw error when use snapshot adapter without invariant hash', async () => {
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: undefined,
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1',
          },
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
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 42,
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1',
          },
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
            value: 'value',
          },
        },
        {
          aggregateId: 'aggregateId',
          aggregateVersion: 1,
          eventType: 'SET',
          timestamp: 1,
          payload: {
            key: 'key',
            value: 'value',
          },
        },
      ]

      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key',
            value: 'value',
          },
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'unknownCommand',
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
      }
    })

    test('should throw error when the aggregateId is not a string', async () => {
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 42 as any,
          type: 'unknownCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 42 as any,
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 42 as any,
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('The "type" argument must be a string')
      }
    })

    test('should throw error when an aggregate does not exist', async () => {
      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [],
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Aggregate "empty" does not exist')
      }
    })

    test('should throw error when an event contains "aggregateId", "aggregateVersion", "timestamp" fields', async () => {
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},

              aggregateId: 'aggregateId',
              aggregateVersion: 'aggregateVersion',
              timestamp: 'timestamp',
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Event "type" is required')
      }
    })

    test('should not return payload: undefined if it is not generated by command', async () => {
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EVENT',
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      await expect(
        executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
        })
      ).resolves.toEqual(
        expect.not.objectContaining({
          payload: undefined,
        })
      )
    })
  })

  describe('with performance tracer', () => {
    test('should success build aggregate state from empty event list and execute cmd', async () => {
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      const event = await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'Entity',
        commands: {
          create: (state: any) => {
            if (state.created) {
              throw new Error('Entity already created')
            }
            return {
              type: 'CREATED',
            }
          },
        },
        projection: {
          Init: () => {
            return {
              created: false,
            }
          },
          CREATED: (state: any) => {
            return {
              ...state,
              created: true,
            }
          },
        },
        invariantHash: 'Entity-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      await executeCommand({
        aggregateName: 'Entity',
        aggregateId: 'aggregateId',
        type: 'create',
      })

      try {
        await executeCommand({
          aggregateName: 'Entity',
          aggregateId: 'aggregateId',
          type: 'create',
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

      const aggregate = makeAggregateMeta({
        name: 'User',
        commands: {
          createUser: (
            aggregateState: any,
            command: any,
            { jwt }: { jwt: any }
          ) => {
            if (Buffer.from(jwt, 'base64').toString('utf8') !== 'ROOT') {
              throw new Error('Access denied')
            }

            return {
              type: 'USER_CREATED',
              payload: {
                id: command.payload.id,
              },
            }
          },
        },
        invariantHash: 'User-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      const event = await executeCommand({
        aggregateName: 'User',
        aggregateId: 'aggregateId',
        type: 'createUser',
        payload: {
          id: 'userId',
        },
        jwt: JWT_TOKEN,
      })

      expect(event).toEqual({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        type: 'USER_CREATED',
        payload: {
          id: 'userId',
        },
        timestamp: Date.now(),
      })

      try {
        await executeCommand({
          aggregateName: 'User',
          aggregateId: 'aggregateId',
          type: 'createUser',
          payload: {
            id: 'userId',
          },
          jwt: 'INCORRECT_JWT_TOKEN',
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

    test('should use snapshots for building state', async () => {
      const aggregate = makeAggregateMeta({
        encryption: () => ({}),
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key2',
          value: 'value2',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(1)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(2)
      expect(events.length).toEqual(2)

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key3',
          value: 'value3',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(2)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(3)
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
      const aggregate = makeAggregateMeta({
        encryption: () => ({}),
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: undefined,
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1',
          },
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
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 42,
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1',
          },
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
            value: 'value',
          },
        },
        {
          aggregateId: 'aggregateId',
          aggregateVersion: 1,
          eventType: 'SET',
          timestamp: 1,
          payload: {
            key: 'key',
            value: 'value',
          },
        },
      ]

      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key',
            value: 'value',
          },
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'unknownCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 42 as any,
          type: 'unknownCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 42 as any,
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 42 as any,
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
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EmptyEvent',
              payload: {},

              aggregateId: 'aggregateId',
              aggregateVersion: 'aggregateVersion',
              timestamp: 'timestamp',
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
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
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              payload: {},
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      try {
        await executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
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

    test('should not return payload: undefined if it is not generated by command', async () => {
      const aggregate = makeAggregateMeta({
        name: 'empty',
        commands: {
          emptyCommand: () => {
            return {
              type: 'EVENT',
            }
          },
        },
        invariantHash: 'empty-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      await expect(
        executeCommand({
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
        })
      ).resolves.toEqual(
        expect.not.objectContaining({
          payload: undefined,
        })
      )
    })
  })
})

describe('dispose', () => {
  describe('without performance tracer', () => {
    test('should dispose the command executor', async () => {
      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [],
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
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand.dispose()

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key2',
            value: 'value2',
          },
        })

        return Promise.reject(new Error('Test failed'))
      } catch (error) {
        expect(error).toBeInstanceOf(CommandError)
        expect(error.message).toEqual('Command handler is disposed')
      }
    })

    test('should dispose the regular handler', async () => {
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1',
        },
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
            value: 'value2',
          },
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
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [],
        performanceTracer,
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
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1',
        },
      })

      expect(eventstoreAdapter.saveSnapshot.mock.calls.length).toEqual(0)
      expect(eventstoreAdapter.loadSnapshot.mock.calls.length).toEqual(1)
      expect(events.length).toEqual(1)

      await executeCommand.dispose()

      try {
        await executeCommand({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key2',
            value: 'value2',
          },
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
      const aggregate = makeAggregateMeta({
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: any) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state: any, event: any) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        invariantHash: 'Map-invariantHash',
      })

      const executeCommand = createCommandExecutor({
        eventstoreAdapter,
        onCommandExecuted,
        aggregates: [aggregate],
        performanceTracer,
      })

      await executeCommand({
        aggregateName: 'Map',
        aggregateId: 'aggregateId',
        type: 'set',
        payload: {
          key: 'key1',
          value: 'value1',
        },
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
            value: 'value2',
          },
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
