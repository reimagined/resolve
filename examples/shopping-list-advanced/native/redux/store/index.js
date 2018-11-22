import devToolsEnhancer from 'remote-redux-devtools'
import createMemoryHistory from 'history/createMemoryHistory'
import { AsyncStorage } from 'react-native'

import { createStore } from 'resolve-redux'
import {
  viewModels,
  readModels,
  aggregates,
  rootPath,
  customConstants,
  subscribeAdapter,
  jwtCookie
} from '../../resolve/config'

import optimisticShoppingLists from '../reducers/optimistic-shopping-lists'
import optimisticSharings from '../reducers/optimistic-sharings'
import refresh from '../reducers/refresh'

import optimisticSharingsMiddleware from '../middlewares/optimistic-sharings-middleware'
import optimisticShoppingListsMiddleware from '../middlewares/optimistic-shopping-lists-middleware'

const origin = `${customConstants.backend.protocol}://${
  customConstants.backend.hostname
}:${customConstants.backend.port}`

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
  middlewares: [
    optimisticShoppingListsMiddleware,
    optimisticSharingsMiddleware
  ],
  sagas: [],
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
