const decodeEmptyString = str =>
  str[str.length - 1] === '\u0004' ? str.substr(0, str.length - 1) : str

const decodeEmptyStrings = payload => {
  if (payload == null) {
    return payload
  } else if (payload.constructor === String) {
    return decodeEmptyString(payload)
  } else if ([Object, Array].includes(payload.constructor)) {
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        payload[key] = decodeEmptyStrings(payload[key])
      }
    }
    return payload
  } else {
    return payload
  }
}

export default decodeEmptyStrings
