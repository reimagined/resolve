import {
  queryReadModelFailure,
  queryReadModelRequest,
  queryReadModelSuccess,
} from '../../src/read-model/actions'
import {
  QUERY_READMODEL_FAILURE,
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
} from '../../src/internal/action-types'

test('queryReadModelRequest', () => {
  expect(
    queryReadModelRequest(
      {
        name: 'users',
        resolver: 'all',
        args: {
          a: 'a',
        },
      },
      { initial: 'state' }
    )
  ).toEqual({
    type: QUERY_READMODEL_REQUEST,
    query: {
      name: 'users',
      resolver: 'all',
      args: {
        a: 'a',
      },
    },
    initialState: {
      initial: 'state',
    },
    selectorId: undefined,
  })
  expect(
    queryReadModelRequest(
      {
        name: 'bots',
        resolver: 'first',
        args: {
          b: 'b',
        },
      },
      { initial: 'diamond' },
      'selector-id'
    )
  ).toEqual({
    type: QUERY_READMODEL_REQUEST,
    query: {
      name: 'bots',
      resolver: 'first',
      args: {
        b: 'b',
      },
    },
    initialState: {
      initial: 'diamond',
    },
    selectorId: 'selector-id',
  })
})

test('queryReadModelSuccess', () => {
  expect(
    queryReadModelSuccess(
      {
        name: 'users',
        resolver: 'all',
        args: {
          a: 'a',
        },
      },
      { data: 'data' }
    )
  ).toEqual({
    type: QUERY_READMODEL_SUCCESS,
    query: {
      name: 'users',
      resolver: 'all',
      args: {
        a: 'a',
      },
    },
    result: {
      data: 'data',
    },
    selectorId: undefined,
  })
  expect(
    queryReadModelSuccess(
      {
        name: 'bots',
        resolver: 'first',
        args: {
          b: 'b',
        },
      },
      { data: 'diamond' },
      'selector-id'
    )
  ).toEqual({
    type: QUERY_READMODEL_SUCCESS,
    query: {
      name: 'bots',
      resolver: 'first',
      args: {
        b: 'b',
      },
    },
    result: {
      data: 'diamond',
    },
    selectorId: 'selector-id',
  })
})

test('queryReadModelFailure', () => {
  expect(
    queryReadModelFailure(
      {
        name: 'users',
        resolver: 'all',
        args: {
          a: 'a',
        },
      },
      Error('error')
    )
  ).toEqual({
    type: QUERY_READMODEL_FAILURE,
    query: {
      name: 'users',
      resolver: 'all',
      args: {
        a: 'a',
      },
    },
    error: Error('error'),
    selectorId: undefined,
  })
  expect(
    queryReadModelFailure(
      {
        name: 'bots',
        resolver: 'first',
        args: {
          b: 'b',
        },
      },
      Error('diamond'),
      'selector-id'
    )
  ).toEqual({
    type: QUERY_READMODEL_FAILURE,
    query: {
      name: 'bots',
      resolver: 'first',
      args: {
        b: 'b',
      },
    },
    error: Error('diamond'),
    selectorId: 'selector-id',
  })
})
