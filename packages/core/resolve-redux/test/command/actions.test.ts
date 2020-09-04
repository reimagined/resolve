import {
  sendCommandRequest,
  sendCommandFailure,
  sendCommandSuccess,
} from '../../src/command/actions'
import {
  SEND_COMMAND_FAILURE,
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_SUCCESS,
} from '../../src/internal/action-types'

test('sendCommandRequest', () => {
  expect(
    sendCommandRequest(
      {
        type: 'create',
        aggregateName: 'aggregate',
        aggregateId: 'aggregate-id',
        payload: {
          a: 'a',
        },
      },
      true
    )
  ).toEqual({
    type: SEND_COMMAND_REQUEST,
    command: {
      type: 'create',
      aggregateName: 'aggregate',
      aggregateId: 'aggregate-id',
      payload: {
        a: 'a',
      },
    },
    usedByHook: true,
  })

  expect(
    sendCommandRequest(
      {
        type: 'drop',
        aggregateName: 'user',
        aggregateId: 'user-id',
        payload: {
          b: 'b',
        },
      },
      false
    )
  ).toEqual({
    type: SEND_COMMAND_REQUEST,
    command: {
      type: 'drop',
      aggregateName: 'user',
      aggregateId: 'user-id',
      payload: {
        b: 'b',
      },
    },
    usedByHook: false,
  })
})

test('sendCommandSuccess', () => {
  expect(
    sendCommandSuccess(
      {
        type: 'drop',
        aggregateName: 'user',
        aggregateId: 'user-id',
        payload: {
          b: 'b',
        },
      },
      {
        data: 'data',
      }
    )
  ).toEqual({
    type: SEND_COMMAND_SUCCESS,
    command: {
      type: 'drop',
      aggregateName: 'user',
      aggregateId: 'user-id',
      payload: {
        b: 'b',
      },
    },
    result: {
      data: 'data',
    },
  })

  expect(
    sendCommandSuccess(
      {
        type: 'create',
        aggregateName: 'aggregate',
        aggregateId: 'aggregate-id',
        payload: {
          a: 'a',
        },
      },
      {
        data: 'diamond',
      }
    )
  ).toEqual({
    type: SEND_COMMAND_SUCCESS,
    command: {
      type: 'create',
      aggregateName: 'aggregate',
      aggregateId: 'aggregate-id',
      payload: {
        a: 'a',
      },
    },
    result: {
      data: 'diamond',
    },
  })
})

test('sendCommandFailure', () => {
  expect(
    sendCommandFailure(
      {
        type: 'drop',
        aggregateName: 'user',
        aggregateId: 'user-id',
        payload: {
          b: 'b',
        },
      },
      Error('error')
    )
  ).toEqual({
    type: SEND_COMMAND_FAILURE,
    command: {
      type: 'drop',
      aggregateName: 'user',
      aggregateId: 'user-id',
      payload: {
        b: 'b',
      },
    },
    error: Error('error'),
  })

  expect(
    sendCommandFailure(
      {
        type: 'create',
        aggregateName: 'aggregate',
        aggregateId: 'aggregate-id',
        payload: {
          a: 'a',
        },
      },
      Error('diamond')
    )
  ).toEqual({
    type: SEND_COMMAND_FAILURE,
    command: {
      type: 'create',
      aggregateName: 'aggregate',
      aggregateId: 'aggregate-id',
      payload: {
        a: 'a',
      },
    },
    error: Error('diamond'),
  })
})
