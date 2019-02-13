const isString = obj => obj != null && obj.constructor === String

const encodeEmptyStrings = event => {
  for (const key in event) {
    if (typeof event[key] === 'object') {
      encodeEmptyStrings(event[key])
    } else if (isString(event[key])) {
      event[key] = `${event[key]}\u0004`
    }
  }
  return event
}

export default encodeEmptyStrings
