import {
  DROP_VIEWMODEL_STATE,
  VIEWMODEL_STATE_UPDATE,
} from '../../src/internal/action-types'
import getHash from '../../src/internal/get-hash'
import { ResultStatus } from '../../src'
import {
  builtInSelectors,
  namedSelectors,
  reducer,
  ViewModelReducerState,
} from '../../src/view-model/view-model-reducer'

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

describe('state update action', () => {
  test('emulate "requested" state on initial view model state for built-in selector', () => {
    const idsKey = getHash(['id1'])
    const argsKey = getHash({ a: 'a' })
    const state = reducer(undefined, {
      type: VIEWMODEL_STATE_UPDATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
      state: {
        user: 'name',
      },
      initial: true,
    })

    expect(state[builtInSelectors]?.queryName[idsKey][argsKey]).toEqual({
      status: ResultStatus.Requested,
      data: {
        user: 'name',
      },
    })
  })

  test('emulate "ready" state on not initial state update for built-in selector', () => {
    const idsKey = getHash(['id1'])
    const argsKey = getHash({ a: 'a' })
    const state = reducer(undefined, {
      type: VIEWMODEL_STATE_UPDATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
      state: {
        user: 'name',
      },
      initial: false,
    })

    expect(state[builtInSelectors]?.queryName[idsKey][argsKey]).toEqual({
      status: ResultStatus.Ready,
      data: {
        user: 'name',
      },
    })
  })

  test('emulate "requested" state on initial view model state for custom selector', () => {
    const state = reducer(undefined, {
      type: VIEWMODEL_STATE_UPDATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
      state: {
        user: 'name',
      },
      initial: true,
      selectorId: 'customSelector',
    })

    expect(state[namedSelectors]?.customSelector).toEqual({
      status: ResultStatus.Requested,
      data: {
        user: 'name',
      },
    })
  })

  test('emulate "ready" state on not initial state update for custom selector', () => {
    const state = reducer(undefined, {
      type: VIEWMODEL_STATE_UPDATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
      state: {
        user: 'name',
      },
      initial: false,
      selectorId: 'customSelector',
    })

    expect(state[namedSelectors]?.customSelector).toEqual({
      status: ResultStatus.Ready,
      data: {
        user: 'name',
      },
    })
  })

  test('state immutability for built-in selector', () => {
    const idsKey = getHash(['id1'])
    const argsKey = getHash({ a: 'a' })
    const sourceState: ViewModelReducerState = {
      [builtInSelectors]: {
        queryName: {
          [idsKey]: {
            [argsKey]: {
              status: ResultStatus.Initial,
              data: {
                user: 'name',
              },
            },
          },
        },
      },
    }
    const state = reducer(sourceState, {
      type: VIEWMODEL_STATE_UPDATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
      state: {
        user: 'name',
      },
      initial: true,
    })
    expect(state).not.toBe(sourceState)
    expect(state[builtInSelectors]).not.toBe(sourceState[builtInSelectors])
    expect(state[builtInSelectors]?.queryName).not.toBe(
      sourceState[builtInSelectors]?.queryName
    )
    expect(state[builtInSelectors]?.queryName[idsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName[idsKey]
    )
    expect(state[builtInSelectors]?.queryName[idsKey][argsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName[idsKey][argsKey]
    )
  })

  test('state immutability for custom selector', () => {
    const sourceState: ViewModelReducerState = {
      [namedSelectors]: {
        customSelector: {
          status: ResultStatus.Initial,
          data: {
            user: 'name',
          },
        },
      },
    }
    const state = reducer(sourceState, {
      type: VIEWMODEL_STATE_UPDATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
      state: {
        user: 'name',
      },
      initial: true,
      selectorId: 'customSelector',
    })
    expect(state).not.toBe(sourceState)
    expect(state[namedSelectors]).not.toBe(sourceState[namedSelectors])
    expect(state[namedSelectors]?.customSelector).not.toBe(
      sourceState[namedSelectors]?.customSelector
    )
  })
})

describe('drop action', () => {
  test(`drop state for built-in selector`, () => {
    const idsKey = getHash(['id1'])
    const argsKey = getHash({ a: 'a' })
    const state = reducer(
      {
        [builtInSelectors]: {
          queryName: {
            [idsKey]: {
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
        type: DROP_VIEWMODEL_STATE,
        query: {
          name: 'queryName',
          aggregateIds: ['id1'],
          args: { a: 'a' },
        },
      }
    )

    expect(state[builtInSelectors]?.queryName[idsKey][argsKey]).toBeUndefined()
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
        type: DROP_VIEWMODEL_STATE,
        query: {
          name: 'queryName',
          aggregateIds: ['id1'],
          args: { a: 'a' },
        },
        selectorId: 'customSelector',
      }
    )

    expect(state[namedSelectors]?.customSelector).toBeUndefined()
  })

  test(`built-in selector state immutability `, () => {
    const idsKey = getHash(['id1'])
    const argsKey = getHash({ a: 'a' })
    const sourceState: ViewModelReducerState = {
      [builtInSelectors]: {
        queryName: {
          [idsKey]: {
            [argsKey]: {
              status: ResultStatus.Requested,
              data: {},
            },
          },
        },
      },
    }

    const state = reducer(sourceState, {
      type: DROP_VIEWMODEL_STATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
        args: { a: 'a' },
      },
    })

    expect(state).not.toBe(sourceState)
    expect(state[builtInSelectors]?.queryName).not.toBe(
      sourceState[builtInSelectors]?.queryName
    )
    expect(state[builtInSelectors]?.queryName[idsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName[idsKey]
    )
    expect(state[builtInSelectors]?.queryName[idsKey][argsKey]).not.toBe(
      sourceState[builtInSelectors]?.queryName[idsKey][argsKey]
    )
  })

  test(`specific selector state immutability`, () => {
    const sourceState: ViewModelReducerState = {
      [namedSelectors]: {
        customSelector: {
          status: ResultStatus.Requested,
          data: {},
        },
      },
    }

    const state = reducer(sourceState, {
      type: DROP_VIEWMODEL_STATE,
      query: {
        name: 'queryName',
        aggregateIds: ['id1'],
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
