import 'regenerator-runtime/runtime'

import buildProjection from './build_projection'
import init from './init'
import reset from './reset'

const DEFAULT_META_NAME = '__ResolveMeta__'

/*
  metaApi:
    getStorageNames: () => ...
    drop: () => ...
    getLastTimestamp: () => ...
    setLastTimestamp: (event.timestamp) => ...

  storeApi:
    ...
    dropStorage: (dropStorage) => ...

  internalContext: object
    internalError: Error
    initHandler
    initDonePromise
    disposePromise
    isInitialized: boolean
    
*/
const createAdapter = (impl, options) => {
  const metaName =
    options instanceof Object ? options.metaName : DEFAULT_META_NAME

  const { metaApi, storeApi } = impl({ metaName, ...options })

  if (!metaApi instanceof Object || !storeApi instanceof Object) {
    throw new Error('Invalid api impl')
  }

  const internalContext = Object.create(null)

  const pool = { metaApi, storeApi, internalContext }

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
