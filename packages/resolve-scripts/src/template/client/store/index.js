import { createStore, applyMiddleware } from 'redux'
import { createResolveMiddleware } from 'resolve-redux'
import reducer from '../reducers'
import viewModels from '../../common/view-models'

const middleware = [createResolveMiddleware({ viewModels })]

export default initialState =>
  createStore(reducer, initialState, applyMiddleware(...middleware))
