import devToolsEnhancer from 'remote-redux-devtools'
import { createMemoryHistory } from 'history'
import { AsyncStorage } from 'react-native'

import getNativeChunk from '../../native-chunk'
import origin from '../../constants/origin'

import optimisticShoppingLists from '../reducers/optimistic-shopping-lists'
import optimisticSharings from '../reducers/optimistic-sharings'
import refresh from '../reducers/refresh'

import optimisticSharingsSaga from '../sagas/optimistic-sharings-saga'
import optimisticShoppingListsSaga from '../sagas/optimistic-shopping-lists-saga'

const {
  resolveRedux: { createStore },
  viewModels,
  rootPath,
  customConstants,
  subscribeAdapter,
  jwtCookie
} = getNativeChunk()

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
    return (await AsyncStorage.getItem(jwtCookie.name)) || ''
  },
  async set(jwt) {
    if (jwt == null) {
      return await AsyncStorage.removeItem(jwtCookie.name)
    }
    return await AsyncStorage.setItem(jwtCookie.name, jwt)
  }
}

const getStore = () =>
  createStore({
    redux,
    viewModels,
    subscribeAdapter,
    initialState,
    history,
    origin,
    rootPath,
    jwtProvider,
    isClient
  })

export default getStore
