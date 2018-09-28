import messages from './messages'

const DEFAULT_META_NAME = '__ResolveMeta__'

const createAdapter = (
  buildProjection,
  checkStoreApi,
  checkTableSchema,
  wrapApis,
  init,
  reset,
  implementation,
  options
) => {
  const metaName =
    options && options.metaName && options.metaName.constructor === String
      ? options.metaName
      : DEFAULT_META_NAME

  if (
    !(implementation instanceof Object) ||
    !(implementation.metaApi instanceof Object) ||
    !(implementation.storeApi instanceof Object)
  ) {
    throw new Error(messages.invalidApiImplementation)
  }

  const pool = {
    adapterContext: Object.create(null),
    internalContext: Object.create(null)
  }

  const { metaApi, storeApi } = wrapApis(implementation, pool, {
    checkStoredTableSchema: checkTableSchema,
    metaName,
    ...options
  })

  pool.storeApi = checkStoreApi({ metaApi, storeApi })
  pool.metaApi = metaApi

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
