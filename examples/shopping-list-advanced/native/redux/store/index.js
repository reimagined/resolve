import devToolsEnhancer from 'remote-redux-devtools'
import createMemoryHistory from 'history/createMemoryHistory'
import { AsyncStorage } from 'react-native'

import { createStore } from 'resolve-redux'

import origin from '../../constants/origin'
import {
  viewModels,
  readModels,
  aggregates,
  rootPath,
  customConstants,
  subscribeAdapter,
  jwtCookie
} from '../../resolve'

import optimisticShoppingLists from '../reducers/optimistic-shopping-lists'
import optimisticSharings from '../reducers/optimistic-sharings'
import refresh from '../reducers/refresh'

import optimisticSharingsSaga from '../sagas/optimistic-sharings-saga'
import optimisticShoppingListsSaga from '../sagas/optimistic-shopping-lists-saga'

const initialState = {}

const history = createMemoryHistory({
  basename: rootPath
})

const isClient = true

const redux = {
  reducers: {
    optimisticShoppingLists,
    optimisticSharings,
    refresh
  },
  middlewares: [],
  sagas: [optimisticSharingsSaga, optimisticShoppingListsSaga],
  enhancers: [
    devToolsEnhancer({
      realtime: true,
      hostname: customConstants.remoteReduxDevTools.hostname,
      port: customConstants.remoteReduxDevTools.port
    })
  ]
}

const jwtProvider = {
  async get() {
    const jwtToken = (await AsyncStorage.getItem(jwtCookie.name)) || ''

    return jwtToken
  },
  async set(jwtToken) {
    if (jwtToken == null) {
      return await AsyncStorage.removeItem(jwtCookie.name)
    }
    return await AsyncStorage.setItem(jwtCookie.name, jwtToken)
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
