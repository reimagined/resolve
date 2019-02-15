export const causalConsistenceWaitTime = 200

const waitEventCausalConsistency = async (
  readModel,
  aggregateId,
  aggregateVersion
) => {
  try {
    do {
      const lastTimestamp = await readModel.metaApi.getLastTimestamp()
      await readModel.metaApi.rollbackTransaction(true)

      if (lastTimestamp == null) {
        await new Promise(resolve =>
          setTimeout(resolve, causalConsistenceWaitTime)
        )
        await readModel.metaApi.beginTransaction(true)
      } else {
        break
      }
    } while (true)

    if (aggregateId === true) {
      return
    }

    const latestEvent = await readModel.eventStore.getLatestEvent({
      eventTypes: readModel.eventTypes,
      ...(aggregateId != null ? { aggregateIds: [aggregateId] } : {})
    })

    if (latestEvent == null) {
      return
    }

    do {
      await readModel.metaApi.beginTransaction(true)
      const isLastEventProcessed = await readModel.metaApi.checkEventProcessed(
        latestEvent.aggregateId,
        aggregateVersion != null
          ? aggregateVersion
          : latestEvent.aggregateVersion
      )
      await readModel.metaApi.rollbackTransaction(true)

      if (!isLastEventProcessed) {
        await new Promise(resolve =>
          setTimeout(resolve, causalConsistenceWaitTime)
        )
      } else {
        break
      }
    } while (true)
  } finally {
    await readModel.metaApi.beginTransaction(true)
  }
}

export default waitEventCausalConsistency
