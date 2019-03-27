const decodeEvent = ({ decodeEmptyStrings }, { payload, ...metaEvent }) => {
  return {
    ...metaEvent,
    ...(payload !== undefined ? { payload: decodeEmptyStrings(payload) } : {})
  }
}

export default decodeEvent
