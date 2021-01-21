import { getAggregatesInteropBuilder } from '../src/aggregate/get-aggregates-interop-builder'
import { CommandError } from '../src/errors'
import { AggregateRuntime, Eventstore } from '../src/aggregate/types'
import { SecretsManager, Event } from '../src/core-types'
import { Monitoring } from '../src/types'
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

const makeTestRuntime = (storedEvents: Event[] = []): AggregateRuntime => {
  const generatedEvents: Event[] = []

  const secretsManager: SecretsManager = {
    getSecret: jest.fn(),
    setSecret: jest.fn(),
    deleteSecret: jest.fn(),
  }

  const eventstore: Eventstore = {
    saveEvent: jest.fn(async (event) => {
      generatedEvents.push(event)
    }),
    getNextCursor: jest.fn(
      (currentCursor) => (currentCursor && currentCursor + 1) || 1
    ),
    loadEvents: jest.fn(({ cursor }) =>
      Promise.resolve({
        events: [...storedEvents, ...generatedEvents].filter(
          (e) => e.aggregateVersion > (cursor || 0)
        ),
      })
    ),
    loadSnapshot: jest.fn((snapshotKey) => snapshots[snapshotKey]),
    saveSnapshot: jest.fn((snapshotKey, data) => {
      snapshots[snapshotKey] = data
    }),
  }

  const monitoring: Monitoring = {
    error: jest.fn(),
    performance: performanceTracer,
  }

  return {
    eventstore,
    secretsManager,
    monitoring,
  }
}

beforeEach(() => {
  snapshots = new Map()

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
  global.Date.now = DateNow
})

test('should success build aggregate state from empty event list and execute cmd', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

  const event = await executeCommand({
    aggregateName: 'empty',
    aggregateId: 'aggregateId',
    type: 'emptyCommand',
  })

  expect(event.aggregateVersion).toEqual(1)
})

test('should success build aggregate state and execute command', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

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
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
      name: 'User',
      commands: {
        createUser: (
          aggregateState: any,
          command: any,
          { jwt }: { jwt: string }
        ) => {
          if (jwt !== 'valid') {
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
    }),
  ])(makeTestRuntime())

  const event = await executeCommand({
    aggregateName: 'User',
    aggregateId: 'aggregateId',
    type: 'createUser',
    payload: {
      id: 'userId',
    },
    jwt: 'valid',
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
      jwt: 'invalid',
    })
    return Promise.reject(new Error('Test failed'))
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Access denied')
  }
})

test('should throw error when the incorrect order of events', async () => {
  const storedEvents: Event[] = [
    {
      aggregateId: 'aggregateId',
      aggregateVersion: 2,
      type: 'SET',
      timestamp: 2,
      payload: {
        key: 'key',
        value: 'value',
      },
    },
    {
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      type: 'SET',
      timestamp: 1,
      payload: {
        key: 'key',
        value: 'value',
      },
    },
  ]

  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime(storedEvents))

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
    expect(error.message).toEqual(
      `Incorrect order of events by aggregateId = "aggregateId"`
    )
    expect(error).toBeInstanceOf(CommandError)
  }
})

test('should throw error when unknown command', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

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
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

  try {
    await executeCommand({
      aggregateName: 'empty',
      aggregateId: 42 as any,
      type: 'unknownCommand',
    })

    return Promise.reject(new Error('Test failed'))
  } catch (error) {
    expect(error.message).toEqual('The "aggregateId" argument must be a string')
    expect(error).toBeInstanceOf(CommandError)
  }
})

test('should throw error when the aggregateName is not a string', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

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
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

  try {
    await executeCommand({
      aggregateName: 'empty',
      aggregateId: 'aggregateId',
      type: 42 as any,
    })

    return Promise.reject(new Error('Test failed'))
  } catch (error) {
    expect(error.message).toEqual('The "type" argument must be a string')
    expect(error).toBeInstanceOf(CommandError)
  }
})

test('should throw error when an aggregate does not exist', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([])(makeTestRuntime())

  try {
    await executeCommand({
      aggregateName: 'empty',
      aggregateId: 'aggregateId',
      type: 'emptyCommand',
    })

    return Promise.reject(new Error('Test failed'))
  } catch (error) {
    expect(error.message).toEqual('Aggregate "empty" does not exist')
    expect(error).toBeInstanceOf(CommandError)
  }
})

test('should throw error when an event contains "aggregateId", "aggregateVersion", "timestamp" fields', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
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
    }),
  ])(makeTestRuntime())

  try {
    await executeCommand({
      aggregateName: 'empty',
      aggregateId: 'aggregateId',
      type: 'emptyCommand',
    })

    return Promise.reject(new Error('Test failed'))
  } catch (error) {
    expect(error.message).toEqual(
      'Event should not contain "aggregateId", "aggregateVersion", "timestamp" fields'
    )
    expect(error).toBeInstanceOf(CommandError)
  }
})

test('should throw error when an event does not contain "type" field', async () => {
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
      name: 'empty',
      commands: {
        emptyCommand: () => {
          return {
            payload: {},
          }
        },
      },
      invariantHash: 'empty-invariantHash',
    }),
  ])(makeTestRuntime())

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
  const { executeCommand } = getAggregatesInteropBuilder([
    makeAggregateMeta({
      name: 'empty',
      commands: {
        emptyCommand: () => {
          return {
            type: 'EVENT',
          }
        },
      },
      invariantHash: 'empty-invariantHash',
    }),
  ])(makeTestRuntime())

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

describe('Snapshots: ', () => {
  test('should use snapshots for building state 2', async () => {
    snapshots['AG;Map-invariantHash;aggregateId'] = JSON.stringify({
      state: JSON.stringify({
        fromSnapshot: 'valueFromSnapshot',
      }),
      version: 1,
      minimalTimestamp: 1,
      cursor: 1,
    })
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
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
      }),
    ])(makeTestRuntime())

    await executeCommand({
      aggregateName: 'Map',
      aggregateId: 'aggregateId',
      type: 'set',
      payload: {
        key: 'fromCommand',
        value: 'valueFromCommand',
      },
    })
    await executeCommand({
      aggregateName: 'Map',
      aggregateId: 'aggregateId',
      type: 'set',
      payload: {
        key: 'fromCommand2',
        value: 'valueFromCommand2',
      },
    })
  })

  test('should use snapshots for building state', async () => {
    const runtime = makeTestRuntime()
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
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
      }),
    ])(runtime)

    const { saveSnapshot, loadSnapshot } = runtime.eventstore as any

    await executeCommand({
      aggregateName: 'Map',
      aggregateId: 'aggregateId',
      type: 'set',
      payload: {
        key: 'key1',
        value: 'value1',
      },
    })
    expect(saveSnapshot.mock.calls.length).toEqual(0)
    expect(loadSnapshot.mock.calls.length).toEqual(1)

    await executeCommand({
      aggregateName: 'Map',
      aggregateId: 'aggregateId',
      type: 'set',
      payload: {
        key: 'key2',
        value: 'value2',
      },
    })

    expect(saveSnapshot.mock.calls.length).toEqual(1)
    expect(loadSnapshot.mock.calls.length).toEqual(2)

    await executeCommand({
      aggregateName: 'Map',
      aggregateId: 'aggregateId',
      type: 'set',
      payload: {
        key: 'key3',
        value: 'value3',
      },
    })

    expect(saveSnapshot.mock.calls.length).toEqual(2)
    expect(loadSnapshot.mock.calls.length).toEqual(3)
    const { events } = await runtime.eventstore.loadEvents({
      aggregateIds: ['aggregateId'],
      cursor: null,
      limit: Number.MAX_SAFE_INTEGER,
    })
    expect(events.length).toEqual(3)
  })

  test('should throw error when use snapshot adapter without invariant hash', async () => {
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
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
      }),
    ])(makeTestRuntime())

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
      expect(error.message).toEqual(
        `Field "invariantHash" is required and must be a string when using aggregate snapshots`
      )
      expect(error).toBeInstanceOf(CommandError)
    }
  })

  test('should throw error when use snapshot adapter with incorrect invariant hash', async () => {
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
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
      }),
    ])(makeTestRuntime())

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
      expect(error.message).toEqual(
        `Field "invariantHash" is required and must be a string when using aggregate snapshots`
      )
      expect(error).toBeInstanceOf(CommandError)
    }
  })
})

describe('monitoring', () => {
  test('calls monitoring.error when command error is thrown', async () => {
    const runtime = makeTestRuntime()
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            throw new Error('Empty command failed')
          },
        },
      }),
    ])(runtime)

    try {
      await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand',
      })

      throw new Error('Test must be failed')
    } catch (e) {
      expect(runtime.monitoring.error).toBeCalledWith(e, 'command', {
        command: {
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'emptyCommand',
        },
      })
    }
  })
  test('calls monitoring.error if command is absent', async () => {
    const runtime = makeTestRuntime()
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            throw new Error('Empty command failed')
          },
        },
      }),
    ])(runtime)

    try {
      await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'unknownCommand',
      })

      throw new Error('Test must be failed')
    } catch (e) {
      expect(runtime.monitoring.error).toBeCalledWith(e, 'command', {
        command: {
          aggregateName: 'empty',
          aggregateId: 'aggregateId',
          type: 'unknownCommand',
        },
      })
    }
  })

  test('calls monitoring.error if aggregate is absent', async () => {
    const runtime = makeTestRuntime()
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            throw new Error('Empty command failed')
          },
        },
      }),
    ])(runtime)

    try {
      await executeCommand({
        aggregateName: 'unknown',
        aggregateId: 'aggregateId',
        type: 'unknownCommand',
      })

      throw new Error('Test must be failed')
    } catch (e) {
      expect(runtime.monitoring.error).toBeCalledWith(e, 'command', {
        command: {
          aggregateName: 'unknown',
          aggregateId: 'aggregateId',
          type: 'unknownCommand',
        },
      })
    }
  })

  test.skip('does not affect command workflow if monitoring.error is failed', async () => {
    const runtime = makeTestRuntime()
    runtime.monitoring.error = () => {
      throw new Error('onCommandFailed failed')
    }
    // const monitoring = {
    //   error: () => {
    //     throw new Error('onCommandFailed failed')
    //   },
    // }

    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            throw new Error('Empty command failed')
          },
        },
      }),
    ])(runtime)

    try {
      await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand',
      })

      throw new Error('Test must be failed')
    } catch (e) {
      expect(e.message).toContain('Empty command failed')
    }
  })

  test('does not affect command workflow if monitoring is absent', async () => {
    const runtime = makeTestRuntime()
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            throw new Error('Empty command failed')
          },
        },
      }),
    ])(runtime)

    try {
      await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand',
      })

      throw new Error('Test must be failed')
    } catch (e) {
      expect(e.message).toContain('Empty command failed')
    }
  })

  test('does not affect command workflow if monitoring.error is absent', async () => {
    const runtime = makeTestRuntime()
    const { executeCommand } = getAggregatesInteropBuilder([
      makeAggregateMeta({
        encryption: () => Promise.resolve({}),
        name: 'empty',
        commands: {
          emptyCommand: () => {
            throw new Error('Empty command failed')
          },
        },
      }),
    ])(runtime)

    try {
      await executeCommand({
        aggregateName: 'empty',
        aggregateId: 'aggregateId',
        type: 'emptyCommand',
      })

      throw new Error('Test must be failed')
    } catch (e) {
      expect(e.message).toContain('Empty command failed')
    }
  })
})

/*

describe('executeCommand', () => {


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
        expect(error.message).toEqual(
          `Field "invariantHash" is required and must be a string when using aggregate snapshots`
        )
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
        expect(error.message).toEqual(
          `Incorrect order of events by aggregateId = "aggregateId"`
        )
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
        expect(error.message).toEqual('The "type" argument must be a string')
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
        expect(error.message).toEqual(
          'Event should not contain "aggregateId", "aggregateVersion", "timestamp" fields'
        )
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
        expect(error.message).toEqual('Event "type" is required')
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
        expect(error.message).toEqual('Command handler is disposed')
        expect(error).toBeInstanceOf(CommandError)
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
        expect(error.message).toEqual('Command handler is disposed')
        expect(error).toBeInstanceOf(CommandError)
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
        expect(error.message).toEqual('Command handler is disposed')
        expect(error).toBeInstanceOf(CommandError)
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
        expect(error.message).toEqual('Command handler is disposed')
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
        expect(error.message).toEqual('Command handler is disposed')
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
        expect(error.message).toEqual('Command handler is disposed')
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
  })
})

*/
