const createPubsubManager = () => {
  const map = new Map()

  const pubsubManager = {
    connect({ client, connectionId, eventTypes, aggregateIds }) {
      if (!map.has(connectionId)) {
        map.set(connectionId, {
          client,
          eventTypes,
          aggregateIds,
        })
      }
    },

    disconnect({ connectionId }) {
      if (!map.has(connectionId)) {
        return
      }

      map.delete(connectionId)
    },

    getConnection({ connectionId }) {
      const connection = map.get(connectionId)

      return connection
    },

    async dispatch({ event }) {
      const promises = []
      const { type, aggregateId } = event

      for (const connectionId of map.keys()) {
        const { eventTypes, aggregateIds, client } = map.get(connectionId)
        if (
          (eventTypes == null || eventTypes?.includes?.(type)) &&
          (aggregateIds == null || aggregateIds?.includes?.(aggregateId))
        ) {
          promises.push(client(JSON.stringify({ type: 'event', event })))
        }
      }

      await Promise.all(promises)
    },
  }

  return pubsubManager
}

export default createPubsubManager
