import { mocked } from 'jest-mock'
import { v4 as uuid } from 'uuid'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Context } from '@resolve-js/client'
import deserializeInitialState from '../src/internal/deserialize-initial-state'
import createResolveMiddleware from '../src/create-resolve-middleware'
import { reducer as viewModelReducer } from '../src/view-model/view-model-reducer'
import { reducer as readModelReducer } from '../src/read-model/read-model-reducer'
import { createResolveStore } from '../src/create-resolve-store'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'generated-uuid'),
}))
jest.mock('redux', () => ({
  createStore: jest.fn(() => ({ store: 'store' })),
  combineReducers: jest.fn(() => 'combined-reducers'),
  applyMiddleware: jest.fn(() => 'applied-middlewares'),
  compose: jest.fn(() => 'composed-enhancers'),
}))
jest.mock('../src/internal/deserialize-initial-state', () =>
  jest.fn(() => ({ deserialized: 'state' }))
)
jest.mock('../src/create-resolve-middleware', () => jest.fn())
jest.mock('../src/view-model/view-model-reducer', () => jest.fn())
jest.mock('../src/read-model/read-model-reducer', () => jest.fn())

const mCreateStore = mocked(createStore)
const mCombineReducers = mocked(combineReducers)
const mApplyMiddleware = mocked(applyMiddleware)
const mCompose = mocked(compose)
const mDeserializeInitialState = mocked(deserializeInitialState)
const mCreateResolveMiddleware = mocked(createResolveMiddleware)
const mUuid = mocked(uuid)

const createMockContext = (viewModels: any[] = []): Context => ({
  origin: '',
  rootPath: '',
  staticPath: '',
  viewModels,
})
const resolveMiddleware = {
  run: jest.fn(),
}

beforeEach(() => {
  mCreateResolveMiddleware.mockReturnValue(resolveMiddleware as any)
})

afterEach(() => {
  mCreateStore.mockClear()
  mCombineReducers.mockClear()
  mApplyMiddleware.mockClear()
  mCompose.mockClear()
  mDeserializeInitialState.mockClear()
  mCreateResolveMiddleware.mockClear()
  mUuid.mockClear()
  resolveMiddleware.run.mockClear()
})

test('store returned', () => {
  expect(createResolveStore(createMockContext())).toEqual({ store: 'store' })
})

test('combined reducers are passed to store factory', () => {
  const customReducer = jest.fn()
  createResolveStore(createMockContext(), {
    redux: {
      reducers: {
        custom: customReducer,
      },
    },
  })
  expect(mCombineReducers).toHaveBeenCalledWith({
    custom: customReducer,
    viewModels: viewModelReducer,
    readModels: readModelReducer,
  })
  expect(mCreateStore).toHaveBeenCalledWith(
    'combined-reducers',
    undefined,
    'composed-enhancers'
  )
})

test('composed enhancers are passed to store factory', () => {
  const customEnhancer = jest.fn()
  createResolveStore(createMockContext(), {
    redux: {
      enhancers: [customEnhancer],
    },
  })
  expect(mApplyMiddleware).toHaveBeenCalledWith(resolveMiddleware)
  expect(mCompose).toHaveBeenCalledWith('applied-middlewares', customEnhancer)
  expect(mCreateStore).toHaveBeenCalledWith(
    'combined-reducers',
    undefined,
    'composed-enhancers'
  )
})

test('resolve middleware started', () => {
  const context = createMockContext()
  const saga = jest.fn()
  createResolveStore(
    context,
    {
      redux: {
        sagas: [saga],
      },
    },
    true
  )
  expect(mUuid).toHaveBeenCalledWith()
  expect(resolveMiddleware.run).toHaveBeenCalledWith(true, {
    store: { store: 'store' },
    resolveContext: context,
    customSagas: [saga],
    sessionId: 'generated-uuid',
  })
})

test('create store with initial state', () => {
  createResolveStore(createMockContext(), {
    redux: {},
    initialState: { initial: 'state' },
  })
  expect(mDeserializeInitialState).not.toHaveBeenCalledWith()
  expect(mCreateStore).toHaveBeenCalledWith(
    'combined-reducers',
    { initial: 'state' },
    'composed-enhancers'
  )
})

test('create store with serialized initial state', () => {
  const context = createMockContext([{ model: 'name' }])

  createResolveStore(context, {
    redux: {},
    serializedState: 'serialized-state',
  })
  expect(mDeserializeInitialState).toHaveBeenCalledWith(
    [{ model: 'name' }],
    'serialized-state'
  )
  expect(mCreateStore).toHaveBeenCalledWith(
    'combined-reducers',
    { deserialized: 'state' },
    'composed-enhancers'
  )
})

test('error if both serialized and object initial state are set', () => {
  expect(() =>
    createResolveStore(createMockContext(), {
      redux: {},
      serializedState: 'serialized-state',
      initialState: { initial: 'state ' },
    })
  ).toThrow()
})
