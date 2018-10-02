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

export default checkStoredTableSchema
