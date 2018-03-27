import path from 'path'
import busAdapter from 'resolve-bus-memory'
import storageAdapter from 'resolve-storage-lite'
import localStrategy from 'resolve-scripts/dist/server/auth/localStrategy'
import aggregates from './common/aggregates'
import readModels from './common/read-models'
import viewModels from './common/view-models'

import localStrategyParams from './auth/localStrategy'

import { cookieName, cookieMaxAge } from './auth/constants'

process.env.JWT_SECRET = 'TEST-JWT-SECRET'

const databaseFilePath = path.join(__dirname, './storage.json')

const storageAdapterParams = process.env.IS_TEST
  ? {}
  : { pathToFile: databaseFilePath }

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
  bus: { adapter: busAdapter },
  storage: {
    adapter: storageAdapter,
    params: storageAdapterParams
  },
  aggregates,
  readModels,
  viewModels,
  jwtCookie,
  auth: {
    strategies: [localStrategy(localStrategyParams)]
  }
}
