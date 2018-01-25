import { expect } from 'chai'
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
      SuccessEvent: (state, event) => {
        lastState = { ...state, value: 42 }
        return lastState
      },
      BrokenEvent: (state, event) => {
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

    expect(event.aggregateVersion).to.be.equal(1)
    expect(aggregateVersion).to.be.equal(0)
  })

  it('should success build aggregate state and execute commnand', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'SuccessEvent', aggregateVersion: 1 }]

    const transaction = executeCommand({
      aggregateName: AGGREGATE_NAME,
      aggregateId: AGGREGATE_ID,
      type: 'emptyCommand'
    })

    const event = await transaction

    expect(event.aggregateVersion).to.be.equal(2)
    expect(aggregateVersion).to.be.equal(1)
    expect(lastState).to.be.deep.equal({
      value: 42
    })
  })

  it('should handle rejection on case of failure on building aggregate state', async () => {
    const executeCommand = createCommandExecutor({ eventStore, aggregates })
    eventList = [{ type: 'BrokenEvent', aggregateVersion: 1 }]

    try {
      const commnand = executeCommand({
        aggregateName: AGGREGATE_NAME,
        aggregateId: AGGREGATE_ID,
        type: 'emptyCommand'
      })

      await commnand

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).to.equal(brokenStateError)
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

    expect(lastState).to.be.equal(aggregate.initialState)
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
      expect(error.message).to.equal('event type is required')
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
      expect(error.message).to.equal('The "aggregateId" argument is required')
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
      expect(error.message).to.equal('The "aggregateName" argument is required')
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
      expect(error.message).to.equal('The "type" argument is required')
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

    expect(aggregate.commands.emptyCommand.lastCall.args[2]).to.be.equal(
      jwtToken
    )

    expect(lastState).to.be.deep.equal({
      value: 42
    })
  })

  it('works the same way for different import types', () => {
    expect(createCommandExecutor).to.be.equal(require('../src'))
  })
})
