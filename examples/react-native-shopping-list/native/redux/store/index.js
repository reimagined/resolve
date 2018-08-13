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
    //console.log('get')
    try {
      //console.log('jwtCookie', jwtCookie)
      const jwtToken = await AsyncStorage.getItem(jwtCookie.name)
      //console.log('jwtToken', jwtToken)
      return jwtToken
    } catch (error) {
      //console.error('Error')
      //console.error(error)
      throw error
    }
  },
  async set(jwtToken) {
    //console.log('set')
    try {
      //console.log('jwtCookie', jwtCookie)
      //console.log('jwtToken', jwtToken)
      return AsyncStorage.setItem(jwtCookie.name, jwtToken)
    } catch (error) {
      //console.error('Error')
      //console.error(error)
      throw error
    }
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
