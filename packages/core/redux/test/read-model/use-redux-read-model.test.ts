import { QueryCallback, ReadModelQuery } from '@resolve-js/client'
import { mocked } from 'ts-jest/utils'
import { useDispatch } from 'react-redux'
import { renderHook, act } from '@testing-library/react-hooks'
import { useQueryBuilder } from '@resolve-js/react-hooks'
import {
  queryReadModelFailure,
  queryReadModelRequest,
  queryReadModelSuccess,
} from '../../src/read-model/actions'
import { getEntry } from '../../src/read-model/read-model-reducer'
import { ResultStatus } from '../../src'
import {
  setSelectorState,
  getSelectorState,
  releaseSelectorState,
} from '../../src/read-model/initial-state-manager'
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
jest.mock('../../src/read-model/initial-state-manager', () => ({
  setSelectorState: jest.fn(),
  getSelectorState: jest.fn(),
  releaseSelectorState: jest.fn(),
}))

const mUseDispatch = mocked(useDispatch)
const mUseQueryBuilder = mocked(useQueryBuilder)
const mGetEntry = mocked(getEntry)
const mDispatch = jest.fn()
const mUseQueryHookExecutor = jest.fn()
const mSetSelectorState = mocked(setSelectorState)
const mGetSelectorState = mocked(getSelectorState)
const mReleaseSelectorState = mocked(releaseSelectorState)

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
  mSetSelectorState.mockClear()
  mGetSelectorState.mockClear()
  mReleaseSelectorState.mockClear()
})

describe('query as plain object overload', () => {
  const makeQuery = (args: any = { a: 'a' }): ReadModelQuery => ({
    name: 'read-model',
    resolver: 'resolver',
    args,
  })
  const initialState = { initial: 'state' }

  test('internal actions are dispatched', () => {
    const query = makeQuery()
    const {
      result: {
        current: { request },
      },
    } = renderHook(() => useReduxReadModel(query, initialState))

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
    mGetSelectorState.mockReturnValueOnce('stored-initial-state')

    const query = makeQuery()
    const {
      result: {
        current: { selector },
      },
    } = renderHook(() => useReduxReadModel(query, initialState))

    const state = {
      readModels: {
        name: {
          resolver: { args: { status: ResultStatus.Ready, data: 'data' } },
        },
      },
    }

    expect(selector(state)).toEqual('state-entry')
    expect(mGetEntry).toHaveBeenCalledWith(
      state.readModels,
      { query },
      {
        status: ResultStatus.Initial,
        data: 'stored-initial-state',
      }
    )
  })

  test('redux state selector: selectorId used', () => {
    mGetSelectorState.mockReturnValueOnce('stored-initial-state')

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
    expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id', {
      status: ResultStatus.Initial,
      data: 'stored-initial-state',
    })
  })

  test('the hook should store initial state on creation', async () => {
    const query = makeQuery()

    const hook = renderHook(() => useReduxReadModel(query, initialState))

    expect(mSetSelectorState).toHaveBeenCalledTimes(1)
    expect(mSetSelectorState).toHaveBeenCalledWith({ query }, initialState)
    mSetSelectorState.mockClear()

    hook.rerender()

    expect(mSetSelectorState).toHaveBeenCalledTimes(0)
  })

  test('the hook should update initial state if query was changed', async () => {
    const queryA = makeQuery()
    const queryB = makeQuery({ b: 'b' })

    const hook = renderHook((q: ReadModelQuery = queryA) =>
      useReduxReadModel(q, initialState)
    )

    expect(mSetSelectorState).toHaveBeenCalledWith(
      { query: queryA },
      initialState
    )
    mSetSelectorState.mockClear()

    hook.rerender(queryB)

    expect(mReleaseSelectorState).toHaveBeenCalledWith({
      query: queryA,
    })
    expect(mSetSelectorState).toHaveBeenCalledWith(
      { query: queryB },
      initialState
    )
  })

  test('the hook should update initial state if it is changed', async () => {
    const query = makeQuery()

    const hook = renderHook((state = initialState) =>
      useReduxReadModel(query, state)
    )

    expect(mSetSelectorState).toHaveBeenCalledWith({ query }, initialState)
    mSetSelectorState.mockClear()

    hook.rerender({
      initial: 'another-state',
    })

    expect(mReleaseSelectorState).toHaveBeenCalledWith({
      query,
    })
    expect(mSetSelectorState).toHaveBeenCalledWith(
      { query },
      { initial: 'another-state' }
    )
  })

  test('the hook should store initial state on creation with selector id', async () => {
    const query = makeQuery()

    const hook = renderHook(() =>
      useReduxReadModel(query, initialState, { selectorId: 'selector-id' })
    )

    expect(mSetSelectorState).toHaveBeenCalledTimes(1)
    expect(mSetSelectorState).toHaveBeenCalledWith('selector-id', initialState)
    mSetSelectorState.mockClear()

    hook.rerender()

    expect(mSetSelectorState).toHaveBeenCalledTimes(0)
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
    mGetSelectorState.mockReturnValueOnce('stored-initial-state')

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
    expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id', {
      status: ResultStatus.Initial,
      data: 'stored-initial-state',
    })
  })

  test('the hook should store initial state on creation', async () => {
    const hook = renderHook(() =>
      useReduxReadModel(builder, initialState, { selectorId: 'selector-id' })
    )

    expect(mSetSelectorState).toHaveBeenCalledTimes(1)
    expect(mSetSelectorState).toHaveBeenCalledWith('selector-id', initialState)
    mSetSelectorState.mockClear()

    hook.rerender()

    expect(mSetSelectorState).toHaveBeenCalledTimes(0)
  })

  test('the hook should update initial state if query was changed', async () => {
    const hook = renderHook((selector = 'selector-id-1') =>
      useReduxReadModel(builder, initialState, {
        selectorId: selector as string,
      })
    )

    expect(mSetSelectorState).toHaveBeenCalledWith(
      'selector-id-1',
      initialState
    )
    mSetSelectorState.mockClear()

    hook.rerender('selector-id-2')

    expect(mReleaseSelectorState).toHaveBeenCalledWith('selector-id-1')
    expect(mSetSelectorState).toHaveBeenCalledWith(
      'selector-id-2',
      initialState
    )
  })

  test('the hook should update initial state if it is changed', async () => {
    const hook = renderHook((state = initialState) =>
      useReduxReadModel(builder, state, {
        selectorId: 'selector-id',
      })
    )

    expect(mSetSelectorState).toHaveBeenCalledWith('selector-id', initialState)
    mSetSelectorState.mockClear()

    hook.rerender({
      initial: 'another-state',
    })

    expect(mReleaseSelectorState).toHaveBeenCalledWith('selector-id')
    expect(mSetSelectorState).toHaveBeenCalledWith('selector-id', {
      initial: 'another-state',
    })
  })
})
