import { ViewModelQuery } from '@resolve-js/client'
import { mocked } from 'jest-mock'
import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react-hooks'
import { useViewModel } from '@resolve-js/react-hooks'
import {
  viewModelEventReceived,
  viewModelStateUpdate,
} from '../../src/view-model/actions'
import { getEntry } from '../../src/view-model/view-model-reducer'
import { useReduxViewModel } from '../../src/view-model/use-redux-view-model'
import { VIEWMODEL_STATE_UPDATE } from '../../src/internal/action-types'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))
jest.mock('@resolve-js/react-hooks', () => ({
  useViewModel: jest.fn(),
}))
jest.mock('../../src/view-model/view-model-reducer', () => ({
  getEntry: jest.fn(() => 'mocked-entry-data'),
}))

const mUseDispatch = mocked(useDispatch)
const mUseViewModel = mocked(useViewModel)
const mGetEntry = mocked(getEntry)
const mDispatch = jest.fn()
const mUseViewModelHook = {
  connect: jest.fn(),
  dispose: jest.fn(),
  initialState: { initial: 'state' },
}

beforeAll(() => {
  mUseDispatch.mockReturnValue(mDispatch)
  mUseViewModel.mockReturnValue(mUseViewModelHook)
})

afterEach(() => {
  mDispatch.mockClear()
  mUseViewModel.mockClear()
  mGetEntry.mockClear()
  mUseViewModelHook.connect.mockClear()
  mUseViewModelHook.dispose.mockClear()
})

const extractStateChangedCallback = (): Function =>
  mUseViewModel.mock.calls[0][3]

const extractEventReceivedCallback = (): Function =>
  mUseViewModel.mock.calls[0][4]

const makeQuery = (): ViewModelQuery => ({
  name: 'view-model',
  aggregateIds: ['id'],
  args: {
    a: 'a',
  },
})

test('useViewModel base hook called with default options', () => {
  const query = makeQuery()
  renderHook(() => useReduxViewModel(query))

  expect(mUseViewModel).toHaveBeenCalledTimes(1)
  expect(mUseViewModel).toHaveBeenCalledWith(
    'view-model',
    ['id'],
    { a: 'a' },
    expect.any(Function),
    expect.any(Function),
    {
      method: 'GET',
    }
  )
})

test('useViewModel base hook called with custom query options', () => {
  renderHook(() =>
    useReduxViewModel(makeQuery(), { queryOptions: { method: 'POST' } })
  )

  expect(mUseViewModel).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    {
      method: 'POST',
    }
  )
})

test('internal actions are dispatched', () => {
  const query = makeQuery()
  renderHook(() => useReduxViewModel(query))

  expect(mDispatch).toHaveBeenCalledTimes(1)
  mDispatch.mockClear()

  const stateChangedCallback = extractStateChangedCallback()

  stateChangedCallback({ data: 'new-data' }, false)
  expect(mDispatch).toHaveBeenCalledWith(
    viewModelStateUpdate(query, { data: 'new-data' }, false)
  )

  const eventReceivedCallback = extractEventReceivedCallback()

  mDispatch.mockClear()
  eventReceivedCallback({
    type: 'EVENT',
    aggregateId: 'aggregate-id',
    timestamp: 123,
    aggregateVersion: 321,
    payload: {
      a: 'a',
    },
  })
  expect(mDispatch).toHaveBeenCalledWith(
    viewModelEventReceived(query, {
      type: 'EVENT',
      aggregateId: 'aggregate-id',
      timestamp: 123,
      aggregateVersion: 321,
      payload: {
        a: 'a',
      },
    })
  )
})

test('internal actions are dispatched (custom selector id)', () => {
  const query = makeQuery()
  renderHook(() =>
    useReduxViewModel(query, {
      selectorId: 'selector-id',
    })
  )

  expect(mDispatch).toHaveBeenCalledTimes(1)
  mDispatch.mockClear()

  const eventReceivedCallback = extractEventReceivedCallback()

  mDispatch.mockClear()
  eventReceivedCallback({
    type: 'EVENT',
    aggregateId: 'aggregate-id',
    timestamp: 123,
    aggregateVersion: 321,
    payload: {
      a: 'a',
    },
  })
  expect(mDispatch).toHaveBeenCalledWith(
    viewModelEventReceived(
      query,
      {
        type: 'EVENT',
        aggregateId: 'aggregate-id',
        timestamp: 123,
        aggregateVersion: 321,
        payload: {
          a: 'a',
        },
      },
      'selector-id'
    )
  )
})

test('custom redux actions', () => {
  const query = makeQuery()
  renderHook(() =>
    useReduxViewModel(query, {
      actions: {
        stateUpdate: (query, state, initial) => ({
          type: 'update',
          query,
          state,
          initial,
        }),
        eventReceived: (query, event) => ({
          type: 'event',
          query,
          event,
        }),
      },
    })
  )

  expect(mDispatch).toHaveBeenCalledTimes(1)
  mDispatch.mockClear()

  const stateChangedCallback = extractStateChangedCallback()

  stateChangedCallback({ data: 'new-data' }, false)
  expect(mDispatch).toHaveBeenCalledWith({
    type: 'update',
    query,
    state: {
      data: 'new-data',
    },
    initial: false,
  })

  const eventReceivedCallback = extractEventReceivedCallback()

  mDispatch.mockClear()
  eventReceivedCallback({
    type: 'EVENT',
    aggregateId: 'aggregate-id',
    timestamp: 123,
    aggregateVersion: 321,
    payload: {
      a: 'a',
    },
  })
  expect(mDispatch).toHaveBeenCalledWith({
    type: 'event',
    query,
    event: {
      type: 'EVENT',
      aggregateId: 'aggregate-id',
      timestamp: 123,
      aggregateVersion: 321,
      payload: {
        a: 'a',
      },
    },
  })
})

test('custom redux actions with custom selector id', () => {
  const query = makeQuery()
  renderHook(() =>
    useReduxViewModel(query, {
      actions: {
        stateUpdate: (query, state, initial, selectorId) => ({
          type: 'update',
          query,
          state,
          initial,
          selectorId,
        }),
        eventReceived: (query, event, selectorId) => ({
          type: 'event',
          query,
          event,
          selectorId,
        }),
      },
      selectorId: 'selector-id',
    })
  )

  expect(mDispatch).toHaveBeenCalledTimes(1)
  mDispatch.mockClear()

  const stateChangedCallback = extractStateChangedCallback()

  stateChangedCallback({ data: 'data' }, false)
  expect(mDispatch).toHaveBeenCalledWith({
    type: 'update',
    query,
    state: {
      data: 'data',
    },
    initial: false,
    selectorId: 'selector-id',
  })

  const eventReceivedCallback = extractEventReceivedCallback()

  mDispatch.mockClear()
  eventReceivedCallback({
    type: 'EVENT',
    aggregateId: 'aggregate-id',
    timestamp: 123,
    aggregateVersion: 321,
    payload: {
      a: 'a',
    },
  })
  expect(mDispatch).toHaveBeenCalledWith({
    type: 'event',
    query,
    event: {
      type: 'EVENT',
      aggregateId: 'aggregate-id',
      timestamp: 123,
      aggregateVersion: 321,
      payload: {
        a: 'a',
      },
    },
    selectorId: 'selector-id',
  })
})

test('cached hook data if underlying executor not changed', () => {
  const hook = renderHook(() => useReduxViewModel(makeQuery()))

  const data = hook.result.current

  hook.rerender()
  expect(hook.result.current).toBe(data)
})

test('selector should call reducer selector with initial state return by underlying hook', () => {
  const query = makeQuery()
  const state = {
    viewModels: {
      modelName: {},
    },
  }
  const hook = renderHook(() => useReduxViewModel(query)).result.current

  expect(hook.selector(state)).toEqual('mocked-entry-data')
  expect(mGetEntry).toHaveBeenCalledWith(state.viewModels, { query })
})

test('selector should call reducer selector with custom selector id', () => {
  const query = makeQuery()
  const state = {
    viewModels: {
      modelName: {},
    },
  }
  const hook = renderHook(() =>
    useReduxViewModel(query, {
      selectorId: 'selector-id',
    })
  ).result.current

  expect(hook.selector(state)).toEqual('mocked-entry-data')
  expect(mGetEntry).toHaveBeenCalledWith(state.viewModels, 'selector-id')
})

test('the hook should dispatch initial state action on creation', () => {
  const query = makeQuery()
  const selectorId = 'selector-id'

  const render = renderHook(() => useReduxViewModel(query, { selectorId }))

  expect(mDispatch).toHaveBeenCalledTimes(1)
  expect(mDispatch).toHaveBeenCalledWith(
    viewModelStateUpdate(query, { initial: 'state' }, true, selectorId)
  )
  mDispatch.mockClear()

  render.rerender()

  expect(mDispatch).toHaveBeenCalledTimes(0)
})

test('the hook should not dispatch any action if no stateUpdate action created defined', () => {
  const query = makeQuery()
  const selectorId = 'selector-id'

  renderHook(() =>
    useReduxViewModel(query, {
      selectorId,
      actions: { stateUpdate: undefined },
    })
  )

  expect(mDispatch).toHaveBeenCalledTimes(0)
})

test('state action creator should be called only once with initial state', () => {
  const query = makeQuery()
  renderHook(() => useReduxViewModel(query))

  const emulateStateChange = extractStateChangedCallback()

  emulateStateChange({}, true)

  expect(mDispatch).toHaveBeenCalledTimes(1)
  expect(mDispatch.mock.calls[0][0]).toEqual({
    type: VIEWMODEL_STATE_UPDATE,
    query,
    state: {
      initial: 'state',
    },
    initial: true,
    selectorId: undefined,
  })
})
