const encodeEmptyStrings = event => {
  for (const key in event) {
    if (!event.hasOwnProperty(key) || event[key] == null) {
      continue
    } else if(event[key].constructor === String) {
      event[key] = `${event[key]}\u0004`
    } else if([Object, Array].includes(event[key].constructor)) {
      encodeEmptyStrings(event[key])
    }
  }
  return event
}

export default encodeEmptyStrings
