const decodeEmptyString = str =>
  str[str.length - 1] === '\u0004'
    ? str.substr(0, str.length - 1)
    : str.substr(0)

const decodeEmptyStrings = payload => {
  if (payload == null) {
    return null
  } else if (payload.constructor === String) {
    return decodeEmptyString(payload)
  } else if (payload.constructor === Number) {
    return +payload
  } else if (payload.constructor === Boolean) {
    return !!payload
  } else if ([Object, Array].includes(payload.constructor)) {
    const nextPayload = Array.isArray(payload) ? [] : {}
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        nextPayload[key] = decodeEmptyStrings(payload[key])
      }
    }
    return nextPayload
  } else {
    throw new Error('Non-serializable payload')
  }
}

export default decodeEmptyStrings
