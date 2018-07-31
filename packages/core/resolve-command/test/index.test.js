import sinon from 'sinon'

import createCommandExecutor from '../src'

describe('resolve-command', () => {
  const AGGREGATE_ID = 'aggregateId'
  const AGGREGATE_NAME = 'aggregateName'
  const brokenStateError = new Error('Broken Error')

  let lastState, eventStore, eventList, aggregateVersion

  const aggregates = [
    {
      initialState: {},
      name: AGGREGATE_NAME,
      // Following arguments redefined in beforeEach section
      projection: null,
      commands: null
    }
  ]

  beforeEach(() => {
    lastState = aggregates[0].initialState
    eventList = []
    aggregateVersion = -1

    eventStore = {
      getEventsByAggregateId: sinon
        .stub()
        .callsFake(
          (eventTypes, handler) =>
            eventList.length ? handler(eventList.shift()) : null
        ),
      saveEvent: sinon.stub().callsFake(event => {
        eventList.push(event)
        return event
      })
    }

    const aggregate = aggregates.find(
      aggregate => aggregate.name === AGGREGATE_NAME
    )

    aggregate.projection = {
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

    const transaction = executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    const event = await transaction

    expect(event.aggregateVersion).toEqual(1)
    expect(aggregateVersion).toEqual(0)
  })

  it('should success build aggregate state and execute command', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    const transaction = executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    const event = await transaction

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
      const command = executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'emptyCommand'
      })

      await command

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toEqual(brokenStateError)
    }
  })

  it('should use initialState in case of projection absence', async () => {
    const aggregate = { ...aggregates[0] }
    delete aggregate.projection

    const executeCommand = createCommandExecutor({
      eventStore,
      aggregates: [aggregate]
    })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    await Promise.resolve()

    expect(lastState).toEqual(aggregate.initialState)
  })

  it('should reject event with type absence', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    const transaction = executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'brokenCommand'
    })

    await Promise.resolve()

    try {
      await transaction
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
    const transaction = executeCommand(
      {
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'emptyCommand'
      },
      jwtToken
    )

    await transaction

    expect(aggregate.commands.emptyCommand.lastCall.args[2]).toEqual(jwtToken)

    expect(lastState).toEqual({
      value: 42
    })
  })
})
