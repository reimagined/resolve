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
