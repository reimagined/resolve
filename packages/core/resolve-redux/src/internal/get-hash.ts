import stringify from 'json-stable-stringify'

const weakMap = new WeakMap()

const getHash = (value: any, placeholder?: string) => {
  if (value == null) {
    if (placeholder == null) {
      throw new Error("Can't calculate hash of null/undefined value")
    }
    return placeholder
  }

  if (
    value.constructor === String ||
    value.constructor === Number ||
    value.constructor === Boolean
  ) {
    return value
  }

  if (value.constructor === Array) {
    return value.join(';')
  }

  if (weakMap.has(value)) {
    return weakMap.get(value)
  }

  const result = stringify(value)
  weakMap.set(value, result)
  return result
}

export default getHash
