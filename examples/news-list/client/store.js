import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import { createResolveMiddleware, createReadModelsReducer } from 'resolve-redux'

const isClient = typeof window === 'object'

const composeEnhancers =
  isClient && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose

const middleware = [createResolveMiddleware({})]

const enhancer = composeEnhancers(applyMiddleware(...middleware))

export default initialState =>
  createStore(
    combineReducers({
      readModels: createReadModelsReducer(),
      ui: (state = {}) => state
    }),
    initialState,
    enhancer
  )
