import stringify from 'json-stable-stringify'

const getHash = value => {
  if (value === '*') {
    return value
  }
  return stringify(value)
}

export default getHash
