import { createStore, applyMiddleware, combineReducers } from 'redux'
import { createResolveMiddleware, createReadModelsReducer } from 'resolve-redux'
import reducer from '../reducers'

const middleware = [createResolveMiddleware({})]

export default initialState =>
  createStore(
    combineReducers({
      readModels: createReadModelsReducer(),
      ui: reducer
    }),
    initialState,
    applyMiddleware(...middleware)
  )
