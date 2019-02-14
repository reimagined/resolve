const encodeEmptyString = str => `${str}\u0004`

const encodeEmptyStrings = payload => {
  if (payload == null) {
    return payload
  } else if (payload.constructor === String) {
    return encodeEmptyString(payload)
  } else if ([Object, Array].includes(payload.constructor)) {
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        payload[key] = encodeEmptyStrings(payload[key])
      }
    }
    return payload
  } else {
    return payload
  }
}

export default encodeEmptyStrings
