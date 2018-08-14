import createMemoryHistory from 'history/createMemoryHistory'
import { AsyncStorage } from 'react-native'

import { createStore } from '../../resolve/resolve-redux'
import {
  viewModels,
  readModels,
  aggregates,
  rootPath,
  origin,
  subscribeAdapter,
  jwtCookie
} from '../../resolve/config'

import reducers from '../reducers'
import middlewares from '../middlewares'

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

const jwtProvider = {
  async get() {
    const jwtToken = (await AsyncStorage.getItem(jwtCookie.name)) || ''

    return jwtToken
  },
  async set(jwtToken) {
    return AsyncStorage.setItem(jwtCookie.name, jwtToken)
  }
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
  jwtProvider,
  isClient
})

export default store
