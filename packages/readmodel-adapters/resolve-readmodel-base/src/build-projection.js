const buildProjection = (
  { metaApi, storeApi, internalContext },
  inputProjection
) => {
  return Object.keys(inputProjection).reduce((projection, eventType) => {
    if (
      eventType === 'Init' &&
      typeof inputProjection[eventType] === 'function'
    ) {
      internalContext.initHandler = inputProjection[eventType]
      return projection
    }

    projection[eventType] = async event => {
      await internalContext.initDonePromise
      const handler = inputProjection[eventType]
      await metaApi.setLastTimestamp(event.timestamp)

      try {
        await handler(storeApi, event)
      } catch (error) {
        internalContext.internalError = error
      }
    }
    return projection
  }, {})
}

export default buildProjection
