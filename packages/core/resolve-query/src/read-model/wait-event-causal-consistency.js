import { causalConsistenceWaitTime } from '../constants'

const waitEventCausalConsistency = async (
  repository,
  aggregateId,
  aggregateVersion
) => {
  const latestEvent = await repository.eventStore.getLatestEvent({
    eventTypes: repository.eventTypes,
    ...(aggregateId != null ? { aggregateIds: [aggregateId] } : {})
  })

  while ((await repository.metaApi.getLastTimestamp()) == null) {
    await new Promise(resolve => setTimeout(resolve, causalConsistenceWaitTime))
  }

  if (latestEvent == null) return

  while (
    !(await repository.metaApi.checkEventProcessed(
      latestEvent.aggregateId,
      aggregateVersion != null ? aggregateVersion : latestEvent.aggregateVersion
    ))
  ) {
    await new Promise(resolve => setTimeout(resolve, causalConsistenceWaitTime))
  }
}

export default waitEventCausalConsistency
