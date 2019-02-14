const decodeEmptyStrings = event => {
  for (const key in event) {
    if (!event.hasOwnProperty(key) || event[key] == null) {
      continue
    } else if(event[key].constructor === String && event[key][event[key].length -1] === '\u0004') {
      event[key] = event[key].substr(0, event[key].length - 1)
    } else if([Object, Array].includes(event[key].constructor)) {
      decodeEmptyStrings(event[key])
    }
  }
  return event
}

export default decodeEmptyStrings
