import {
  DROP_READMODEL_STATE,
  QUERY_READMODEL_FAILURE,
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
} from '../../src/internal/action-types'
import {
  builtInSelectors,
  namedSelectors,
  ReadModelReducerState,
  reducer,
} from '../../src/read-model/read-model-reducer'
import { ResultStatus } from '../../src'

describe('default', () => {
  test('return initial state', () => {
    const dynamic = reducer as Function
    expect(dynamic(undefined, { type: 'INIT' })).toEqual({})
  })

  test('bypass current state on unknown action', () => {
    const dynamic = reducer as Function
    const state = { viewModels: { model: {} } }
    expect(dynamic(state, { type: 'INIT' })).toBe(state)
  })
})

describe('request action', () => {
  test(`initial state`, () => {
    const state = reducer(undefined, {
      type: QUERY_READMODEL_REQUEST,
      initialState: { initial: 'state' },
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
    })

    expect(
      state[builtInSelectors]?.queryName.queryResolver[
        JSON.stringify({ a: 'a' })
      ]
    ).toEqual({
      status: ResultStatus.Requested,
      data: {
        initial: 'state',
      },
    })
  })

  test(`specific selector`, () => {
    const state = reducer(undefined, {
      type: QUERY_READMODEL_REQUEST,
      initialState: { initial: 'state' },
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
      selectorId: 'selectorId',
    })

    expect(state[namedSelectors]?.['selectorId']).toEqual({
      status: ResultStatus.Requested,
      data: {
        initial: 'state',
      },
    })
  })

  test(`built-in selector state immutability `, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const initialState: ReadModelReducerState = {
      [builtInSelectors]: {
        queryName: {
          queryResolver: {
            [argsKey]: {
              status: ResultStatus.Initial,
              data: {
                a: 'a',
              },
            },
          },
        },
      },
    }

    const state = reducer(initialState, {
      type: QUERY_READMODEL_REQUEST,
      initialState: { initial: 'state' },
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: {
          a: 'a',
        },
      },
    })

    expect(state).not.toBe(initialState)
    expect(state[builtInSelectors]?.queryName).not.toBe(
      initialState[builtInSelectors]?.queryName
    )
    expect(state[builtInSelectors]?.queryName.queryResolver).not.toBe(
      initialState[builtInSelectors]?.queryName.queryResolver
    )
    expect(state[builtInSelectors]?.queryName.queryResolver[argsKey]).not.toBe(
      initialState[builtInSelectors]?.queryName.queryResolver[argsKey]
    )
  })

  test(`specific selector state immutability `, () => {
    const initialState: ReadModelReducerState = {
      [namedSelectors]: {
        customSelector: {
          status: ResultStatus.Initial,
          data: {
            a: 'a',
          },
        },
      },
    }

    const state = reducer(initialState, {
      type: QUERY_READMODEL_REQUEST,
      initialState: { initial: 'state' },
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: {
          a: 'a',
        },
      },
      selectorId: 'customSelector',
    })

    expect(state).not.toBe(initialState)
    expect(state[namedSelectors]?.customSelector).not.toBe(
      initialState[namedSelectors]?.customSelector
    )
  })
})

describe('success action', () => {
  test(`update state for built-in selector`, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const state = reducer(
      {
        [builtInSelectors]: {
          queryName: {
            queryResolver: {
              [argsKey]: {
                status: ResultStatus.Requested,
                data: {},
              },
            },
          },
        },
      },
      {
        type: QUERY_READMODEL_SUCCESS,
        query: {
          name: 'queryName',
          resolver: 'queryResolver',
          args: { a: 'a' },
        },
        result: {
          data: {
            user: 'name',
          },
        },
      }
    )

    expect(state[builtInSelectors]?.queryName.queryResolver[argsKey]).toEqual({
      status: ResultStatus.Ready,
      data: {
        user: 'name',
      },
    })
  })

  test(`update state for specific selector`, () => {
    const state = reducer(
      {
        [namedSelectors]: {
          customSelector: {
            status: ResultStatus.Requested,
            data: {},
          },
        },
      },
      {
        type: QUERY_READMODEL_SUCCESS,
        query: {
          name: 'queryName',
          resolver: 'queryResolver',
          args: { a: 'a' },
        },
        result: {
          data: {
            user: 'name',
          },
        },
        selectorId: 'customSelector',
      }
    )

    expect(state[namedSelectors]?.customSelector).toEqual({
      status: ResultStatus.Ready,
      data: {
        user: 'name',
      },
    })
  })

  test(`built-in selector state immutability `, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const sourceState: ReadModelReducerState = {
      [builtInSelectors]: {
        queryName: {
          queryResolver: {
            [argsKey]: {
              status: ResultStatus.Requested,
              data: {},
            },
          },
        },
      },
    }

    const state = reducer(sourceState, {
      type: QUERY_READMODEL_SUCCESS,
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
      result: {
        data: {
          user: 'name',
        },
      },
    })

    expect(state).not.toBe(sourceState)
    expect(state[builtInSelectors]?.queryName).not.toBe(
      sourceState[builtInSelectors]?.queryName
    )
    expect(state[builtInSelectors]?.queryName.queryResolver).not.toBe(
      sourceState[builtInSelectors]?.queryName.queryResolver
    )
    expect(state[builtInSelectors]?.queryName.queryResolver[argsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName.queryResolver[argsKey]
    )
  })

  test(`specific selector state immutability`, () => {
    const sourceState: ReadModelReducerState = {
      [namedSelectors]: {
        customSelector: {
          status: ResultStatus.Requested,
          data: {},
        },
      },
    }

    const state = reducer(sourceState, {
      type: QUERY_READMODEL_SUCCESS,
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
      result: {
        data: {
          user: 'name',
        },
      },
      selectorId: 'customSelector',
    })

    expect(state).not.toBe(sourceState)
    expect(state[namedSelectors]?.customSelector).not.toBe(
      sourceState[namedSelectors]?.customSelector
    )
  })
})

describe('failure action', () => {
  test(`update state for built-in selector`, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const state = reducer(
      {
        [builtInSelectors]: {
          queryName: {
            queryResolver: {
              [argsKey]: {
                status: ResultStatus.Requested,
                data: {},
              },
            },
          },
        },
      },
      {
        type: QUERY_READMODEL_FAILURE,
        query: {
          name: 'queryName',
          resolver: 'queryResolver',
          args: { a: 'a' },
        },
        error: Error('error'),
      }
    )

    expect(state[builtInSelectors]?.queryName.queryResolver[argsKey]).toEqual({
      status: ResultStatus.Failed,
      error: 'error',
      data: null,
    })
  })

  test(`update state for specific selector`, () => {
    const state = reducer(
      {
        [namedSelectors]: {
          customSelector: {
            status: ResultStatus.Requested,
            data: {},
          },
        },
      },
      {
        type: QUERY_READMODEL_FAILURE,
        query: {
          name: 'queryName',
          resolver: 'queryResolver',
          args: { a: 'a' },
        },
        error: Error('error'),
        selectorId: 'customSelector',
      }
    )

    expect(state[namedSelectors]?.customSelector).toEqual({
      status: ResultStatus.Failed,
      error: 'error',
      data: null,
    })
  })

  test(`built-in selector state immutability `, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const sourceState: ReadModelReducerState = {
      [builtInSelectors]: {
        queryName: {
          queryResolver: {
            [argsKey]: {
              status: ResultStatus.Requested,
              data: {},
            },
          },
        },
      },
    }

    const state = reducer(sourceState, {
      type: QUERY_READMODEL_FAILURE,
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
      error: Error('error'),
    })

    expect(state).not.toBe(sourceState)
    expect(state[builtInSelectors]?.queryName).not.toBe(
      sourceState[builtInSelectors]?.queryName
    )
    expect(
      state[builtInSelectors]?.queryName.queryResolver.queryResolver
    ).not.toBe(sourceState[builtInSelectors]?.queryName.queryResolver)
    expect(state[builtInSelectors]?.queryName.queryResolver[argsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName.queryResolver[argsKey]
    )
  })

  test(`specific selector state immutability`, () => {
    const sourceState: ReadModelReducerState = {
      [namedSelectors]: {
        customSelector: {
          status: ResultStatus.Requested,
          data: {},
        },
      },
    }

    const state = reducer(sourceState, {
      type: QUERY_READMODEL_FAILURE,
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
      error: Error('error'),
      selectorId: 'customSelector',
    })

    expect(state).not.toBe(sourceState)
    expect(state[namedSelectors]?.customSelector).not.toBe(
      sourceState[namedSelectors]?.customSelector
    )
  })
})

describe('drop action', () => {
  test(`drop state for built-in selector`, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const state = reducer(
      {
        [builtInSelectors]: {
          queryName: {
            queryResolver: {
              [argsKey]: {
                status: ResultStatus.Ready,
                data: {
                  user: 'name',
                },
              },
            },
          },
        },
      },
      {
        type: DROP_READMODEL_STATE,
        query: {
          name: 'queryName',
          resolver: 'queryResolver',
          args: { a: 'a' },
        },
      }
    )

    expect(
      state[builtInSelectors]?.queryName.queryResolver[argsKey]
    ).toBeUndefined()
  })

  test(`drop state for specific selector`, () => {
    const state = reducer(
      {
        [namedSelectors]: {
          customSelector: {
            status: ResultStatus.Requested,
            data: {},
          },
        },
      },
      {
        type: DROP_READMODEL_STATE,
        query: {
          name: 'queryName',
          resolver: 'queryResolver',
          args: { a: 'a' },
        },
        selectorId: 'customSelector',
      }
    )

    expect(state[namedSelectors]?.customSelector).toBeUndefined()
  })

  test(`built-in selector state immutability `, () => {
    const argsKey = JSON.stringify({ a: 'a' })
    const sourceState: ReadModelReducerState = {
      [builtInSelectors]: {
        queryName: {
          queryResolver: {
            [argsKey]: {
              status: ResultStatus.Requested,
              data: {},
            },
          },
        },
      },
    }

    const state = reducer(sourceState, {
      type: DROP_READMODEL_STATE,
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
    })

    expect(state).not.toBe(sourceState)
    expect(state[builtInSelectors]?.queryName).not.toBe(
      sourceState[builtInSelectors]?.queryName
    )
    expect(
      state[builtInSelectors]?.queryName.queryResolver.queryResolver
    ).not.toBe(sourceState[builtInSelectors]?.queryName.queryResolver)
    expect(state[builtInSelectors]?.queryName.queryResolver[argsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName.queryResolver[argsKey]
    )
  })

  test(`specific selector state immutability`, () => {
    const sourceState: ReadModelReducerState = {
      [namedSelectors]: {
        customSelector: {
          status: ResultStatus.Requested,
          data: {},
        },
      },
    }

    const state = reducer(sourceState, {
      type: DROP_READMODEL_STATE,
      query: {
        name: 'queryName',
        resolver: 'queryResolver',
        args: { a: 'a' },
      },
      selectorId: 'customSelector',
    })

    expect(state).not.toBe(sourceState)
    expect(state[namedSelectors]?.customSelector).not.toBe(
      sourceState[namedSelectors]?.customSelector
    )
  })
})
