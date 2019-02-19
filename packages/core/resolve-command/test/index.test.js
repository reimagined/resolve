import sinon from 'sinon'

import createCommandExecutor from '../src'
import { CommandError } from '../src'

describe('resolve-command', () => {
  const AGGREGATE_ID = 'aggregateId'
  const AGGREGATE_NAME = 'aggregateName'
  const brokenStateError = new Error('Broken Error')

  let lastState, eventStore, eventList, aggregateVersion

  const aggregates = [
    {
      name: AGGREGATE_NAME,
      projection: {
        Init: () => ({})
      },
      commands: null
    }
  ]

  beforeEach(() => {
    lastState = aggregates[0].projection.Init()
    eventList = []
    aggregateVersion = -1

    eventStore = {
      loadEvents: sinon.stub().callsFake(async (filter, handler) => {
        const sortedEventList = eventList.sort((a, b) => {
          if (a.timestamp < b.timestamp) {
            return -1
          }
          if (
            a.timestamp === b.timestamp &&
            a.aggregateVersion < b.aggregateVersion
          ) {
            return -1
          }
          if (a.timestamp === b.timestamp) {
            return 0
          }
          return 1
        })

        while (sortedEventList.length > 0) {
          await handler(sortedEventList.shift())
        }
      }),
      saveEvent: sinon.stub().callsFake(async event => {
        eventList.push(event)
        return event
      })
    }

    const aggregate = aggregates.find(
      aggregate => aggregate.name === AGGREGATE_NAME
    )

    aggregate.projection = {
      Init: () => ({}),
      SuccessEvent: state => {
        lastState = { ...state, value: 42 }
        return lastState
      },
      BrokenEvent: () => {
        throw brokenStateError
      }
    }

    aggregate.commands = {
      emptyCommand: (aggregateState, command, jwtToken, version) => {
        aggregateVersion = version
        return {
          type: 'EmptyEvent',
          payload: {}
        }
      },
      brokenCommand: () => ({
        type: '', //broken type
        payload: {}
      })
    }
  })

  afterEach(() => {
    lastState = null
    eventStore = null
    eventList = null
  })

  it('should success build aggregate state from empty event list and execute cmd', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = []

    const event = await executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    expect(event.aggregateVersion).toEqual(1)
    expect(aggregateVersion).toEqual(0)
  })

  it('should success build aggregate state and execute command', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    const event = await executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    expect(event.aggregateVersion).toEqual(2)
    expect(aggregateVersion).toEqual(1)
    expect(lastState).toEqual({
      value: 42
    })
  })

  it('should handle rejection on case of failure on building aggregate state', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'BrokenEvent', aggregateVersion: 1 }]

    try {
      await executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'emptyCommand'
      })

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toEqual(brokenStateError)
    }
  })

  it('should use initialState on case of empty state', async () => {
    const aggregate = { ...aggregates[0] }

    const executeCommand = createCommandExecutor({
      eventStore,
      aggregates: [aggregate]
    })
    eventList = []

    await executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    expect(lastState).toEqual(aggregate.projection.Init())
  })

  it('should reject event with type absence', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    try {
      await executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'brokenCommand'
      })

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toEqual('event type is required')
    }
  })

  it('should reject command with aggregateId absence', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })

    try {
      await executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: null,
        type: 'brokenCommand'
      })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toEqual('The "aggregateId" argument is required')
    }
  })

  it('should reject command with aggregateName absence', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })

    try {
      await executeCommand({
        aggregateName: null,
        aggregateId: AGGREGATE_ID,
        type: 'brokenCommand'
      })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toEqual('The "aggregateName" argument is required')
    }
  })

  it('should reject command with type absence', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })

    try {
      await executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: null
      })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toEqual('The "type" argument is required')
    }
  })

  it('should pass security context to command handler', async () => {
    const aggregate = aggregates.find(
      aggregate => aggregate.name === AGGREGATE_NAME
    )
    aggregate.commands.emptyCommand = sinon
      .stub()
      .callsFake(aggregate.commands.emptyCommand)

    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    const jwtToken = 'JWT-TOKEN'
    await executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand',
      jwtToken
    })

    expect(aggregate.commands.emptyCommand.lastCall.args[2]).toEqual(jwtToken)

    expect(lastState).toEqual({
      value: 42
    })
  })

  it('Regression test. Invalid aggregate version in event storage by aggregateId', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [
      {
        aggregateId: AGGREGATE_ID,
        aggregateVersion: 1,
        eventType: 'AAA',
        timestamp: 1
      },
      {
        aggregateId: AGGREGATE_ID,
        aggregateVersion: 2,
        eventType: 'AAA',
        timestamp: 3
      },
      {
        aggregateId: AGGREGATE_ID,
        aggregateVersion: 3,
        eventType: 'AAA',
        timestamp: 2
      }
    ]

    const jwtToken = 'JWT-TOKEN'
    try {
      await executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'emptyCommand',
        jwtToken
      })

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual(
        'Invalid aggregate version in event storage by aggregateId = aggregateId'
      )
    }
  })

  it('Regression test. Incorrect command type', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = []

    const jwtToken = 'JWT-TOKEN'
    try {
      await executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'unknownCommand',
        jwtToken
      })

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(CommandError)
    }
  })
})
