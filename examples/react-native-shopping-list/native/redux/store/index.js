import createMemoryHistory from 'history/createMemoryHistory'

import { createStore } from '../../resolve/resolve-redux'
import {
  viewModels,
  readModels,
  aggregates,
  subscribeAdapter,
  rootPath,
  origin
} from '../../resolve/config'

import reducers from '../reducers/index'
import middlewares from '../middlewares/index'

const initialState = {}

const history = createMemoryHistory({
  basename: rootPath
})

const isClient = true

const redux = {
  reducers,
  middlewares,
  store: () => {}
}

const store = createStore({
  redux,
  viewModels,
  readModels,
  aggregates,
  subscribeAdapter,
  initialState,
  history,
  origin,
  rootPath,
  isClient
})

export default store
