const encodeEvent = ({ encodeEmptyStrings }, { payload, ...metaEvent }) => {
  return {
    ...metaEvent,
    ...(payload !== undefined ? { payload: encodeEmptyStrings(payload) } : {})
  }
}

export default encodeEvent
