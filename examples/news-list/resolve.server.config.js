import path from 'path'
import memoryAdapter from 'resolve-storage-lite'
import busAdapter from 'resolve-bus-memory'

import aggregates from './common/aggregates'
import readModels from './common/read-models'
import viewModels from './common/view-models'
import sagas from './common/sagas'

if (module.hot) {
  module.hot.accept()
}

const { NODE_ENV = 'development' } = process.env
const dbPath = path.join(__dirname, `${NODE_ENV}.db`)

export default {
  bus: { adapter: busAdapter },
  storage: {
    adapter: memoryAdapter,
    params: { inMemoryOnly: true }
  },
  aggregates,
  readModels,
  viewModels,
  sagas
}
