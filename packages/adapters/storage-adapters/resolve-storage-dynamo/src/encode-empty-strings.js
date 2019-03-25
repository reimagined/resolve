const encodeEmptyString = str => `${str}\u0004`

const encodeEmptyStrings = payload => {
  if (payload == null) {
    return null
  } else if (payload.constructor === String) {
    return encodeEmptyString(payload)
  } else if (payload.constructor === Number) {
    return +payload
  } else if (payload.constructor === Boolean) {
    return !!payload
  } else if ([Object, Array].includes(payload.constructor)) {
    const nextPayload = Array.isArray(payload) ? [] : {}
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        nextPayload[key] = encodeEmptyStrings(payload[key])
      }
    }
    return nextPayload
  } else {
    throw new Error('Non-serializable payload')
  }
}

export default encodeEmptyStrings
