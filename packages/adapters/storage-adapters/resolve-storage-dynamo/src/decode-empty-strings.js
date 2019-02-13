const isString = obj => obj != null && obj.constructor === String

const decodeEmptyStrings = event => {
  for (const key in event) {
    if (!event.hasOwnProperty(key)) continue
    const value = event[key]
    if (typeof value === 'object') {
      decodeEmptyStrings(value)
    } else if (isString(value) && value[value.length - 1] === '\u0004') {
      event[key] = value.substr(0, value.length - 1)
    }
  }
  return event
}

export default decodeEmptyStrings
