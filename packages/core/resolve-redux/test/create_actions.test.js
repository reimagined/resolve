import { SEND_COMMAND_REQUEST } from '../src/action_types'
import createActions from '../src/create_actions'

describe('createActions', () => {
  it('should create an action from an aggregate to send command', () => {
    const commandType = 'create'
    const aggregateId = 'aggregateId'
    const aggregateName = 'aggregateName'
    const payload = {
      value: 42
    }

    const aggregate = {
      name: aggregateName,
      commands: {
        create: () => {}
      }
    }
    const generatedActions = createActions(aggregate)
    expect(generatedActions.create(aggregateId, payload)).toEqual({
      type: SEND_COMMAND_REQUEST,
      commandType,
      aggregateId,
      aggregateName,
      payload
    })
  })

  it('should create an action from an aggregate and extend it by extended actions', () => {
    const commandType = 'create'
    const originalUpdateCommand = 'originalUpdate'
    const originalDeleteCommand = 'originalDelete'

    const aggregateId = 'aggregateId'
    const aggregateName = 'aggregateName'
    const payload = {
      value: 42
    }

    const aggregate = {
      name: aggregateName,
      commands: {
        create: () => {},
        update: () => {}
      }
    }
    const generatedActions = createActions(aggregate, {
      update: () => ({ type: originalUpdateCommand }),
      delete: () => ({ type: originalDeleteCommand })
    })

    expect(generatedActions.create(aggregateId, payload)).toEqual({
      type: SEND_COMMAND_REQUEST,
      commandType,
      aggregateId,
      aggregateName,
      payload
    })

    expect(generatedActions.update()).toEqual({
      type: originalUpdateCommand
    })

    expect(generatedActions.delete()).toEqual({
      type: originalDeleteCommand
    })
  })
})
