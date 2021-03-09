import {
  viewModelEventReceived,
  viewModelStateUpdate,
  dropViewModelState,
} from '../../src/view-model/actions'
import {
  DROP_VIEWMODEL_STATE,
  VIEWMODEL_EVENT_RECEIVED,
  VIEWMODEL_STATE_UPDATE,
} from '../../src/internal/action-types'

test('viewModelStateUpdate', () => {
  expect(
    viewModelStateUpdate(
      {
        name: 'users',
        aggregateIds: ['id'],
        args: {
          a: 'a',
        },
      },
      { state: 'state' },
      true
    )
  ).toEqual({
    type: VIEWMODEL_STATE_UPDATE,
    query: {
      name: 'users',
      aggregateIds: ['id'],
      args: {
        a: 'a',
      },
    },
    state: { state: 'state' },
    initial: true,
    selectorId: undefined,
  })
  expect(
    viewModelStateUpdate(
      {
        name: 'bots',
        aggregateIds: ['id1'],
        args: {
          b: 'b',
        },
      },
      { state: 'diamond' },
      false,
      'selector-id'
    )
  ).toEqual({
    type: VIEWMODEL_STATE_UPDATE,
    query: {
      name: 'bots',
      aggregateIds: ['id1'],
      args: {
        b: 'b',
      },
    },
    state: { state: 'diamond' },
    initial: false,
    selectorId: 'selector-id',
  })
})

test('viewModelEventReceived', () => {
  expect(
    viewModelEventReceived(
      {
        name: 'users',
        aggregateIds: ['id'],
        args: {
          a: 'a',
        },
      },
      {
        aggregateId: 'aggregate-id',
        aggregateVersion: 123,
        timestamp: 321,
        type: 'EVENT',
        payload: {
          data: 'data',
        },
      }
    )
  ).toEqual({
    type: VIEWMODEL_EVENT_RECEIVED,
    query: {
      name: 'users',
      aggregateIds: ['id'],
      args: {
        a: 'a',
      },
    },
    event: {
      aggregateId: 'aggregate-id',
      aggregateVersion: 123,
      timestamp: 321,
      type: 'EVENT',
      payload: {
        data: 'data',
      },
    },
    selectorId: undefined,
  })
  expect(
    viewModelEventReceived(
      {
        name: 'bots',
        aggregateIds: ['id1'],
        args: {
          b: 'b',
        },
      },
      {
        aggregateId: 'aggregate-id-1',
        aggregateVersion: 321,
        timestamp: 123,
        type: 'EVENT-2',
        payload: {
          test: 'test',
        },
      },
      'selector-id'
    )
  ).toEqual({
    type: VIEWMODEL_EVENT_RECEIVED,
    query: {
      name: 'bots',
      aggregateIds: ['id1'],
      args: {
        b: 'b',
      },
    },
    event: {
      aggregateId: 'aggregate-id-1',
      aggregateVersion: 321,
      timestamp: 123,
      type: 'EVENT-2',
      payload: {
        test: 'test',
      },
    },
    selectorId: 'selector-id',
  })
})

test('dropViewModelState', () => {
  expect(
    dropViewModelState({
      name: 'users',
      aggregateIds: ['id'],
      args: {
        a: 'a',
      },
    })
  ).toEqual({
    type: DROP_VIEWMODEL_STATE,
    query: {
      name: 'users',
      aggregateIds: ['id'],
      args: {
        a: 'a',
      },
    },
    selectorId: undefined,
  })
  expect(
    dropViewModelState(
      {
        name: 'bots',
        aggregateIds: ['id1'],
        args: {
          b: 'b',
        },
      },
      'selector-id'
    )
  ).toEqual({
    type: DROP_VIEWMODEL_STATE,
    query: {
      name: 'bots',
      aggregateIds: ['id1'],
      args: {
        b: 'b',
      },
    },
    selectorId: 'selector-id',
  })
})
