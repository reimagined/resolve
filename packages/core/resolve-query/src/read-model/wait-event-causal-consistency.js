import { causalConsistenceWaitTime } from '../constants'

const waitEventCausalConsistency = async (
  repository,
  aggregateId,
  aggregateVersion
) => {
  try {
    await repository.metaApi.rollbackTransaction(true)

    const latestEvent = await repository.eventStore.getLatestEvent({
      eventTypes: repository.eventTypes,
      ...(aggregateId != null ? { aggregateIds: [aggregateId] } : {})
    })

    do {
      await repository.metaApi.beginTransaction(true)
      const lastTimestamp = await repository.metaApi.getLastTimestamp()
      await repository.metaApi.rollbackTransaction(true)

      if (lastTimestamp == null) {
        await new Promise(resolve =>
          setTimeout(resolve, causalConsistenceWaitTime)
        )
      } else {
        break
      }
    } while (true)

    if (latestEvent == null) {
      return
    }

    do {
      await repository.metaApi.beginTransaction(true)
      const isLastEventProcessed = await repository.metaApi.checkEventProcessed(
        latestEvent.aggregateId,
        aggregateVersion != null
          ? aggregateVersion
          : latestEvent.aggregateVersion
      )
      await repository.metaApi.rollbackTransaction(true)

      if (!isLastEventProcessed) {
        await new Promise(resolve =>
          setTimeout(resolve, causalConsistenceWaitTime)
        )
      } else {
        break
      }
    } while (true)
  } finally {
    await repository.metaApi.beginTransaction(true)
  }
}

export default waitEventCausalConsistency
