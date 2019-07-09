// BSON Types in mongodb: https://docs.mongodb.com/manual/reference/bson-types/
// Type schema conversion algorithm in mongodb native driver: https://bit.ly/2weXEnh
// Only allowed in *Resolve Read-model Query & Projection API* data types are present
const bsonTypesMap = new Map([
  [String, 'string'],
  [Number, ['double', 'int', 'long', 'decimal']],
  [Array, 'array'],
  [Boolean, 'bool'],
  [Object, 'object'],
  [null, 'null']
])

const transformCompareOperator = operation => {
  const key = Object.keys(operation)[0]
  const value = operation[key]
  const type = bsonTypesMap.get(value != null ? value.constructor : null)

  if (type == null) {
    throw new Error(`Invalid BSON type provided: ${value}`)
  }

  switch (key) {
    case '$eq':
      return { $eq: value, $type: type }
    case '$ne':
      return { $not: { $eq: value, $type: type } }
    case '$lt':
      return { $lt: value, $type: type }
    case '$lte':
      return { $lte: value, $type: type }
    case '$gt':
      return { $gt: value, $type: type }
    case '$gte':
      return { $gte: value, $type: type }
    default:
      throw new Error('Invalid operator')
  }
}

const isOperatorValue = value =>
  value != null &&
  Object.keys(value)[0] != null &&
  Object.keys(value)[0][0] === '$'

const wrapSearchExpression = (expression, rootIndex) => {
  const searchKeys = Object.keys(expression)
  const operatorKeys = searchKeys.filter(key => key.indexOf('$') > -1)

  const result =
    operatorKeys.length === 0
      ? searchKeys.reduce((acc, key) => {
          acc[key] = transformCompareOperator(
            !isOperatorValue(expression[key])
              ? { $eq: expression[key] }
              : expression[key]
          )

          return acc
        }, {})
      : operatorKeys.reduce((acc, key) => {
          if (Array.isArray(expression[key])) {
            acc[key] = expression[key].map(wrapSearchExpression)
          } else {
            acc[key] = wrapSearchExpression(expression[key])
          }

          return acc
        }, {})

  if (rootIndex != null) {
    return { $and: [{ [rootIndex]: { $exists: false } }, result] }
  } else {
    return result
  }
}

export default wrapSearchExpression
