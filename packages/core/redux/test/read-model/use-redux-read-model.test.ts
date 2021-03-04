import { QueryCallback, ReadModelQuery } from '@resolve-js/client'
import { mocked } from 'ts-jest/utils'
import { useDispatch } from 'react-redux'
import { renderHook, act } from '@testing-library/react-hooks'
import { useQueryBuilder } from '@resolve-js/react-hooks'
import {
  initReadModel,
  queryReadModelFailure,
  queryReadModelRequest,
  queryReadModelSuccess,
} from '../../src/read-model/actions'
import { getEntry } from '../../src/read-model/read-model-reducer'
import { ResultStatus } from '../../src'
import {
  useReduxReadModel,
  ReduxReadModelHookOptions,
} from '../../src/read-model/use-redux-read-model'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))
jest.mock('@resolve-js/react-hooks', () => ({
  useQueryBuilder: jest.fn(),
}))
jest.mock('../../src/read-model/read-model-reducer', () => ({
  getEntry: jest.fn(() => 'state-entry'),
}))

const mUseDispatch = mocked(useDispatch)
const mUseQueryBuilder = mocked(useQueryBuilder)
const mGetEntry = mocked(getEntry)
const mDispatch = jest.fn()
const mUseQueryHookExecutor = jest.fn()

const extractUseQueryBuilderCallback = (): QueryCallback<ReadModelQuery> =>
  mUseQueryBuilder.mock.calls[0][2]

beforeAll(() => {
  mUseDispatch.mockReturnValue(mDispatch)
  mUseQueryBuilder.mockReturnValue(mUseQueryHookExecutor)
})

afterEach(() => {
  mDispatch.mockClear()
  mUseQueryBuilder.mockClear()
  mUseQueryHookExecutor.mockClear()
})

describe('query as plain object overload', () => {
  const makeQuery = (): ReadModelQuery => ({
    name: 'read-model',
    resolver: 'resolver',
    args: {
      a: 'a',
    },
  })
  const initialState = { initial: 'state' }

  test('internal actions are dispatched', () => {
    const query = makeQuery()
    const {
      result: {
        current: { request },
      },
    } = renderHook(() => useReduxReadModel(query, initialState))

    expect(mDispatch).toHaveBeenCalledTimes(1)
    mDispatch.mockClear()

    act(() => request())

    expect(mDispatch).toHaveBeenCalledWith(
      queryReadModelRequest(query, { initial: 'state' })
    )

    const callback = extractUseQueryBuilderCallback()

    mDispatch.mockClear()
    callback(null, { data: { result: 'ok' } }, query)
    expect(mDispatch).toHaveBeenCalledWith(
      queryReadModelSuccess(query, { data: { result: 'ok' } })
    )

    mDispatch.mockClear()
    callback(Error('error'), null, query)
    expect(mDispatch).toHaveBeenCalledWith(
      queryReadModelFailure(query, Error('error'))
    )
  })

  test('useQueryBuilder base hook called with generic query builder', () => {
    const query = makeQuery()
    renderHook(() => useReduxReadModel(query, initialState))

    expect(mUseQueryBuilder).toHaveBeenCalledTimes(1)
    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {
        method: 'GET',
      },
      expect.any(Function)
    )

    const genericBuilder = mUseQueryBuilder.mock.calls[0][0]
    expect(genericBuilder(query)).toEqual(query)
  })

  test('useQueryBuilder base hook called with custom dependencies', () => {
    const dependency = 'dependency'

    renderHook(() => useReduxReadModel(makeQuery(), initialState, [dependency]))

    expect(mUseQueryBuilder).toHaveBeenCalledTimes(1)
    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {
        method: 'GET',
      },
      expect.any(Function),
      [dependency]
    )
  })

  test('useQueryBuilder base hook called with custom query options are passed to base hook', () => {
    renderHook(() =>
      useReduxReadModel(makeQuery(), initialState, {
        queryOptions: {
          method: 'POST',
        },
      })
    )

    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.anything(),
      { method: 'POST' },
      expect.anything()
    )
  })

  test('useQueryBuilder base hook called with custom query options and dependencies', () => {
    const dependency = 'dependency'
    renderHook(() =>
      useReduxReadModel(
        makeQuery(),
        initialState,
        {
          queryOptions: {
            method: 'POST',
          },
        },
        [dependency]
      )
    )

    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.anything(),
      { method: 'POST' },
      expect.anything(),
      [dependency]
    )
  })

  test('custom redux actions', () => {
    const query = makeQuery()
    const {
      result: {
        current: { request },
      },
    } = renderHook(() =>
      useReduxReadModel(
        query,
        { initial: 'state' },
        {
          actions: {
            request: (query, initialState) => ({
              type: 'request',
              query,
              initialState,
            }),
            success: (query, result) => ({ type: 'success', query, result }),
            failure: (query, error) => ({ type: 'failure', query, error }),
          },
        }
      )
    )

    act(() => request())

    expect(mDispatch).toHaveBeenCalledWith({
      type: 'request',
      query,
      initialState: { initial: 'state' },
    })

    const callback = extractUseQueryBuilderCallback()

    mDispatch.mockClear()
    callback(null, { data: { a: 'a' } }, query)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'success',
      query,
      result: { data: { a: 'a' } },
    })

    mDispatch.mockClear()
    callback(Error('error'), null, query)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'failure',
      query,
      error: Error('error'),
    })
  })

  test('cached hook data if underlying executor not changed', () => {
    const dependency = 'dependency'
    const hook = renderHook(() =>
      useReduxReadModel(makeQuery(), initialState, [dependency])
    )

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed', () => {
    const hook = renderHook(() => useReduxReadModel(makeQuery(), initialState))

    const data = hook.result.current

    mUseQueryBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed', () => {
    const hook = renderHook(() => useReduxReadModel(makeQuery(), initialState))

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('cached hook data if underlying executor not changed (with options)', () => {
    const hook = renderHook(() =>
      useReduxReadModel(makeQuery(), initialState, {
        queryOptions: {
          method: 'POST',
        },
      })
    )

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed (with options)', () => {
    const hook = renderHook(() =>
      useReduxReadModel(makeQuery(), initialState, {
        queryOptions: {
          method: 'POST',
        },
      })
    )

    const data = hook.result.current

    mUseQueryBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed (with options)', () => {
    const hook = renderHook(() =>
      useReduxReadModel(makeQuery(), initialState, {
        queryOptions: {
          method: 'POST',
        },
      })
    )

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('redux state selector: no selectorId', () => {
    const query = makeQuery()
    const {
      result: {
        current: { selector },
      },
    } = renderHook(() => useReduxReadModel(query, { initial: 'state' }))

    const state = {
      readModels: {
        name: {
          resolver: { args: { status: ResultStatus.Ready, data: 'data' } },
        },
      },
    }

    expect(selector(state)).toEqual('state-entry')
    expect(mGetEntry).toHaveBeenCalledWith(state.readModels, { query })
  })

  test('redux state selector: selectorId used', () => {
    const query = makeQuery()
    const {
      result: {
        current: { selector },
      },
    } = renderHook(() =>
      useReduxReadModel(
        query,
        { initial: 'state' },
        { selectorId: 'selector-id' }
      )
    )

    const state = {
      readModels: {
        name: {
          resolver: { args: { status: ResultStatus.Ready, data: 'data' } },
        },
      },
    }

    expect(selector(state)).toEqual('state-entry')
    expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id')
  })

  test('the hook should dispatch initial state action on creation', async () => {
    const query = makeQuery()

    const hook = renderHook(() => useReduxReadModel(query, initialState))

    expect(mDispatch).toHaveBeenCalledTimes(1)
    expect(mDispatch).toHaveBeenCalledWith(
      initReadModel(initialState, query, undefined)
    )
    mDispatch.mockClear()

    hook.rerender()

    expect(mDispatch).toHaveBeenCalledTimes(0)
  })
  test('the hook should dispatch initial state action on creation with selector id', async () => {
    const query = makeQuery()

    const hook = renderHook(() =>
      useReduxReadModel(query, initialState, { selectorId: 'selector-id' })
    )

    expect(mDispatch).toHaveBeenCalledTimes(1)
    expect(mDispatch).toHaveBeenCalledWith(
      initReadModel(initialState, undefined, 'selector-id')
    )
    mDispatch.mockClear()

    hook.rerender()

    expect(mDispatch).toHaveBeenCalledTimes(0)
  })
})

describe('query as builder function overload', () => {
  const builder = (a: string): ReadModelQuery => ({
    name: 'read-model',
    resolver: 'resolver',
    args: {
      a,
    },
  })
  const initialState = { initial: 'state' }

  const validOptions: ReduxReadModelHookOptions<ReadModelQuery> = {
    selectorId: 'custom-selector',
  }

  test('forbid hook without custom selector and without custom action creators', () => {
    expect(
      renderHook(() => useReduxReadModel(builder, { initial: 'state' })).result
        .error
    ).toBeInstanceOf(Error)
  })

  test('allow hook with custom selector', () => {
    expect(
      renderHook(() =>
        useReduxReadModel(
          builder,
          { initial: 'state' },
          { selectorId: 'selector' }
        )
      ).result.error
    ).toBeUndefined()
  })

  test('allow hook with custom action creators', () => {
    expect(
      renderHook(() =>
        useReduxReadModel(
          builder,
          { initial: 'state' },
          {
            actions: {
              success: (query, result, selectorId) => ({
                type: 'action',
                query,
                selectorId,
                result,
              }),
            },
          }
        )
      ).result.error
    ).toBeUndefined()
  })

  test('internal actions are dispatched', () => {
    const {
      result: {
        current: { request },
      },
    } = renderHook(() =>
      useReduxReadModel(builder, { initial: 'state' }, validOptions)
    )
    expect(mDispatch).toHaveBeenCalledTimes(1)
    mDispatch.mockClear()

    act(() => request('test'))

    const expectedQuery = builder('test')
    expect(mDispatch).toHaveBeenCalledWith(
      queryReadModelRequest(
        expectedQuery,
        { initial: 'state' },
        validOptions.selectorId
      )
    )

    const callback = extractUseQueryBuilderCallback()

    mDispatch.mockClear()
    callback(null, { data: { result: 'ok' } }, expectedQuery)
    expect(mDispatch).toHaveBeenCalledWith(
      queryReadModelSuccess(
        expectedQuery,
        { data: { result: 'ok' } },
        validOptions.selectorId
      )
    )

    mDispatch.mockClear()
    callback(Error('error'), null, expectedQuery)
    expect(mDispatch).toHaveBeenCalledWith(
      queryReadModelFailure(
        expectedQuery,
        Error('error'),
        validOptions.selectorId
      )
    )
  })

  test('useQueryBuilder base hook called with generic query builder', () => {
    renderHook(() => useReduxReadModel(builder, initialState, validOptions))

    expect(mUseQueryBuilder).toHaveBeenCalledTimes(1)
    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {
        method: 'GET',
      },
      expect.any(Function)
    )

    const genericBuilder = mUseQueryBuilder.mock.calls[0][0]
    expect(genericBuilder({ a: 'a' })).toEqual({ a: 'a' })
  })

  test('useQueryBuilder base hook called with custom dependencies', () => {
    const dependency = 'dependency'

    renderHook(() =>
      useReduxReadModel(builder, initialState, validOptions, [dependency])
    )

    expect(mUseQueryBuilder).toHaveBeenCalledTimes(1)
    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.any(Function),
      {
        method: 'GET',
      },
      expect.any(Function),
      [dependency]
    )
  })

  test('useQueryBuilder base hook called with with custom query options', () => {
    renderHook(() =>
      useReduxReadModel(builder, initialState, {
        ...validOptions,
        queryOptions: {
          method: 'POST',
        },
      })
    )

    expect(mUseQueryBuilder).toHaveBeenCalledWith(
      expect.anything(),
      { method: 'POST' },
      expect.anything()
    )
  })

  test('custom redux actions', () => {
    const {
      result: {
        current: { request },
      },
    } = renderHook(() =>
      useReduxReadModel(
        builder,
        { initial: 'state' },
        {
          actions: {
            request: (query, initialState) => ({
              type: 'request',
              query,
              initialState,
            }),
            success: (query, result) => ({ type: 'success', query, result }),
            failure: (query, error) => ({ type: 'failure', query, error }),
          },
        }
      )
    )

    act(() => request('test'))

    const query = builder('test')

    expect(mDispatch).toHaveBeenCalledWith({
      type: 'request',
      query,
      initialState: { initial: 'state' },
    })

    const callback = extractUseQueryBuilderCallback()

    mDispatch.mockClear()
    callback(null, { data: { a: 'a' } }, query)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'success',
      query,
      result: { data: { a: 'a' } },
    })

    mDispatch.mockClear()
    callback(Error('error'), null, query)
    expect(mDispatch).toHaveBeenCalledWith({
      type: 'failure',
      query,
      error: Error('error'),
    })
  })

  test('cached hook data if underlying executor not changed', () => {
    const dependency = 'dependency'
    const hook = renderHook(() =>
      useReduxReadModel(builder, initialState, validOptions, [dependency])
    )

    const data = hook.result.current

    hook.rerender()
    expect(hook.result.current).toBe(data)
  })

  test('new hook if underlying executor has been changed', () => {
    const hook = renderHook(() =>
      useReduxReadModel(builder, initialState, validOptions)
    )

    const data = hook.result.current

    mUseQueryBuilder.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('new hook if redux dispatch has been changed', () => {
    const hook = renderHook(() =>
      useReduxReadModel(builder, initialState, validOptions)
    )

    const data = hook.result.current

    mUseDispatch.mockReturnValueOnce(jest.fn())
    hook.rerender()

    expect(hook.result.current).not.toBe(data)
  })

  test('redux state selector: selectorId used', () => {
    const {
      result: {
        current: { selector },
      },
    } = renderHook(() =>
      useReduxReadModel(
        builder,
        { initial: 'state' },
        { selectorId: 'selector-id' }
      )
    )

    const state = {
      readModels: {
        name: {
          resolver: { args: { status: ResultStatus.Ready, data: 'data' } },
        },
      },
    }

    expect(selector(state)).toEqual('state-entry')
    expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id')
  })
  test('the hook should not dispatch anything if no selector id set', async () => {
    renderHook(() => useReduxReadModel(builder, initialState))

    expect(mDispatch).toHaveBeenCalledTimes(0)
  })

  test('the hook should dispatch initial state action on creation with selector id', async () => {
    const hook = renderHook(() =>
      useReduxReadModel(builder, initialState, { selectorId: 'selector-id' })
    )

    expect(mDispatch).toHaveBeenCalledTimes(1)
    expect(mDispatch).toHaveBeenCalledWith(
      initReadModel(initialState, undefined, 'selector-id')
    )
    mDispatch.mockClear()

    hook.rerender()

    expect(mDispatch).toHaveBeenCalledTimes(0)
  })
})
