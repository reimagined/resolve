import devToolsEnhancer from 'remote-redux-devtools'
import { createMemoryHistory } from 'history'
import { AsyncEventstore } from 'react-native'

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
    const jwtToken = (await AsyncEventstore.getItem(jwtCookie.name)) || ''

    return jwtToken
  },
  async set(jwtToken) {
    if (jwtToken == null) {
      return await AsyncEventstore.removeItem(jwtCookie.name)
    }
    return await AsyncEventstore.setItem(jwtCookie.name, jwtToken)
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
