import 'regenerator-runtime/runtime'

import buildProjection from './build_projection'
import checkStoreApi from './checkStoreApi'
import init from './init'
import reset from './reset'

const DEFAULT_META_NAME = '__ResolveMeta__'

/*
  metaApi:
    getStorageInfo: async (storageName) => ...
    storageExists: async (storageName) => ...
    describeStorage: async (storageName, indexes) => ...
    getStorageNames: async () => ...
    drop: async () => ...
    getLastTimestamp: async () => ...
    setLastTimestamp: async (event.timestamp) => ...

  storeApi:
    ...

  internalContext: object
    internalError: Error
    initHandler
    initDonePromise
    disposePromise
    isInitialized: boolean

*/
const createAdapter = (impl, options) => {
  const metaName =
    options && options.metaName && options.metaName.constructor === String
      ? options.metaName
      : DEFAULT_META_NAME

  const { metaApi, storeApi } = impl({ metaName, ...options })

  if (!metaApi instanceof Object || !storeApi instanceof Object) {
    throw new Error('Invalid api impl')
  }

  const pool = {
    metaApi,
    storeApi: checkStoreApi({ metaApi, storeApi }),
    internalContext: Object.create(null)
  }

  return Object.create(null, {
    buildProjection: {
      value: buildProjection.bind(null, pool)
    },
    init: {
      value: init.bind(null, pool)
    },
    reset: {
      value: reset.bind(null, pool)
    }
  })
}

export default createAdapter
