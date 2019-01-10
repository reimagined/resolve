import messages from './messages'

const DEFAULT_META_NAME = '__ResolveMeta__'
const DEFAULT_TABLE_PREFIX = ''

const createAdapter = (
  checkStoreApi,
  checkTableSchema,
  bindWithConnection,
  bindReadModel,
  dispose,
  implementation,
  options
) => {
  const metaName =
    options && options.metaName && options.metaName.constructor === String
      ? options.metaName
      : DEFAULT_META_NAME

  const tablePrefix =
    options && options.tablePrefix && options.tablePrefix.constructor === String
      ? options.tablePrefix
      : DEFAULT_TABLE_PREFIX

  if (
    !(implementation instanceof Object) ||
    !(implementation.metaApi instanceof Object) ||
    !(implementation.storeApi instanceof Object)
  ) {
    throw new Error(messages.invalidApiImplementation)
  }

  const { connect, disconnect, drop, ...metaApi } = implementation.metaApi

  const pool = {
    adapterContext: Object.create(null),
    internalContext: Object.create(null),
    bindWithConnection,
    checkStoreApi,
    checkTableSchema,
    storeApi: implementation.storeApi,
    metaApi,
    connect,
    metaName,
    tablePrefix,
    options
  }

  Object.assign(pool, {
    disconnect: bindWithConnection(pool, disconnect),
    drop: bindWithConnection(pool, drop)
  })

  return Object.create(null, {
    bindReadModel: {
      value: bindReadModel.bind(null, pool)
    },
    dispose: {
      value: dispose.bind(null, pool)
    }
  })
}

export default createAdapter
