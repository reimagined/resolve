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
      if (event == null || event.constructor !== Object) {
        return
      }

      const aggregatesVersionsMap = await metaApi.getLastAggregatesVersions()

      const expectedAggregateVersion = aggregatesVersionsMap.get(
        event.aggregateId
      )
      if (
        expectedAggregateVersion != null &&
        event.aggregateVersion <= expectedAggregateVersion
      ) {
        return
      }

      await inputProjection[eventType](storeApi, event)
      await metaApi.setLastTimestamp(event.timestamp)

      await metaApi.setLastAggregateVersion(
        event.aggregateId,
        event.aggregateVersion
      )
    }

    return projection
  }, {})
}

export default buildProjection
