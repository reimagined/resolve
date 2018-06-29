import stringify from 'json-stable-stringify'

const weakMap = new WeakMap()

const getHash = value => {
  if (value == null) {
    throw new Error('Can not calculate hash of null/undefined value')
  }

  if (
    value.constructor === String ||
    value.constructor === Number ||
    value.constructor === Boolean
  ) {
    return value
  }

  if (weakMap.has(value)) {
    return weakMap.get(value)
  }

  const result = stringify(value)
  weakMap.set(value, result)
  return result
}

export default getHash
