const EVENT_MALFORMED = 'EVENT_MALFORMED'
const EVENT_OUTDATED = 'EVENT_OUTDATED'
const EVENT_OUT_OF_ORDER = 'EVENT_OUT_OF_ORDER'
const EVENT_SUCCESS = 'EVENT_SUCCESS'

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

    projection[eventType] = async (event, maybeUnordered) => {
      if (event == null || event.constructor !== Object) {
        return EVENT_MALFORMED
      }

      const aggregatesVersionsMap = await metaApi.getLastAggregatesVersions()

      const expectedAggregateVersion = aggregatesVersionsMap.get(
        event.aggregateId
      )
      if (
        expectedAggregateVersion != null &&
        event.aggregateVersion <= expectedAggregateVersion
      ) {
        return EVENT_OUTDATED
      }

      if (
        maybeUnordered &&
        !(
          (expectedAggregateVersion == null && event.aggregateVersion === 1) ||
          expectedAggregateVersion + 1 === event.aggregateVersion
        )
      ) {
        return EVENT_OUT_OF_ORDER
      }

      await inputProjection[eventType](storeApi, event)

      if (!maybeUnordered) {
        await metaApi.setLastTimestamp(event.timestamp)
      }

      await metaApi.setLastAggregateVersion(
        event.aggregateId,
        event.aggregateVersion
      )

      return EVENT_SUCCESS
    }

    return projection
  }, {})
}

export default buildProjection
