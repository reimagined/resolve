import messages from './messages'

const DEFAULT_META_NAME = '__ResolveMeta__'

const createAdapter = (
  buildProjection,
  checkStoreApi,
  init,
  reset,
  implementation,
  options
) => {
  const metaName =
    options && options.metaName && options.metaName.constructor === String
      ? options.metaName
      : DEFAULT_META_NAME

  const api = implementation({ metaName, ...options })
  if (!api || !api instanceof Object) {
    throw new Error(messages.invalidApiImplementation)
  }

  const { metaApi, storeApi } = api

  if (
    !metaApi ||
    !storeApi ||
    !metaApi instanceof Object ||
    !storeApi instanceof Object
  ) {
    throw new Error(messages.invalidApiImplementation)
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
