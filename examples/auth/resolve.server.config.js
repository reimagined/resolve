import path from 'path'
import busAdapter from 'resolve-bus-memory'
import { resolveAuth } from 'resolve-auth'

//import localStrategy from 'resolve-scripts/dist/server/auth/localStrategy'
//import localStrategyParams from './auth/localStrategy'

import fileAdapter from 'resolve-storage-lite'
import aggregates from './common/aggregates'
import readModels from './common/read-models'
import viewModels from './common/view-models'
import clientConfig from './resolve.client.config.js'

import { authStrategy, authStrategyParams } from './auth/localStrategy'

import { cookieName, cookieMaxAge } from './auth/constants'

process.env.JWT_SECRET = 'TEST-JWT-SECRET'

if (module.hot) {
  module.hot.accept()
}

const { NODE_ENV = 'development' } = process.env
const dbPath = path.join(__dirname, `${NODE_ENV}.db`)

const jwtCookie = {
  name: cookieName,
  maxAge: cookieMaxAge,
  httpOnly: false
}
Object.defineProperty(jwtCookie, 'httpOnly', {
  get: () => false,
  set: () => {}
})

export default {
  entries: clientConfig,
  bus: { adapter: busAdapter },
  storage: {
    adapter: fileAdapter,
    params: { pathToFile: dbPath }
  },
  initialState: () => ({}),
  aggregates,
  initialSubscribedEvents: { types: [], ids: [] },
  readModels,
  viewModels,
  jwtCookie,
  auth: {
    strategies: [resolveAuth(authStrategy, authStrategyParams)]
    //    strategies: [localStrategy(localStrategyParams)]
  }
}
