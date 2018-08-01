import messages from './messages'

const DEFAULT_META_NAME = '__ResolveMeta__'

const PROPER_NAME_REGEXP = /^(?:\w|\d|-)+?$/

const PRIMARY_INDEX_TYPES = ['primary-number', 'primary-string']
const SECONDARY_INDEX_TYPES = ['secondary-number', 'secondary-string']
const FIELD_TYPES = [
  ...PRIMARY_INDEX_TYPES,
  ...SECONDARY_INDEX_TYPES,
  'regular'
]

const checkStoredTableSchema = (tableName, tableDescription) =>
  PROPER_NAME_REGEXP.test(tableName) &&
  tableDescription != null &&
  tableDescription.constructor === Object &&
  Object.keys(tableDescription).reduce(
    (result, fieldName) =>
      result &&
      PROPER_NAME_REGEXP.test(fieldName) &&
      FIELD_TYPES.indexOf(tableDescription[fieldName]) > -1,
    true
  ) &&
  Object.keys(tableDescription).reduce(
    (result, fieldName) =>
      result +
      (PRIMARY_INDEX_TYPES.indexOf(tableDescription[fieldName]) > -1 ? 1 : 0),
    0
  ) === 1

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

  const api = implementation({ metaName, checkStoredTableSchema, ...options })
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
