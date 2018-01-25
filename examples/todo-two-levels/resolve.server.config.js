import React from 'react'
import path from 'path'
import fileAdapter from 'resolve-storage-lite'
import busAdapter from 'resolve-bus-memory'
import { StaticRouter } from 'react-router'

import aggregates from './common/aggregates'
import readModels from './common/read-models'
import viewModels from './common/view-models'
import routes from './client/routes'
import createStore from './client/store'

if (module.hot) {
  module.hot.accept()
}

const { NODE_ENV = 'development' } = process.env
const dbPath = path.join(__dirname, `${NODE_ENV}.db`)

export default {
  entries: {
    routes,
    createStore
  },
  bus: { adapter: busAdapter },
  storage: {
    adapter: fileAdapter,
    params: { pathToFile: dbPath }
  },
  aggregates,
  readModels,
  viewModels,
  extendExpress: () => {}
}
