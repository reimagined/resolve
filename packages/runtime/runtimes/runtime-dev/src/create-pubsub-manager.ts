import type {
  PubsubConnection,
  PubsubConnectionOptions,
  PubsubManager,
} from './types'

export const createPubSubManager = (): PubsubManager => {
  const map = new Map<string, PubsubConnection>()

  return {
    connect({
      client,
      connectionId,
      eventTypes,
      aggregateIds,
    }: PubsubConnectionOptions) {
      if (!map.has(connectionId)) {
        map.set(connectionId, {
          client,
          eventTypes,
          aggregateIds,
        })
      }
    },

    disconnect({
      connectionId,
    }: {
      connectionId: PubsubConnectionOptions['connectionId']
    }) {
      if (!map.has(connectionId)) {
        return
      }

      map.delete(connectionId)
    },

    getConnection({
      connectionId,
    }: {
      connectionId: PubsubConnectionOptions['connectionId']
    }) {
      const connection = map.get(connectionId)

      return connection
    },

    async dispatch({
      event,
    }: {
      event: { type: string; aggregateId: string }
    }) {
      const promises = []
      const { type, aggregateId } = event

      for (const { eventTypes, aggregateIds, client } of map.values()) {
        if (
          (eventTypes == null || eventTypes?.includes?.(type)) &&
          (aggregateIds == null || aggregateIds?.includes?.(aggregateId))
        ) {
          promises.push(
            client(
              JSON.stringify({ type: 'events', payload: { events: [event] } })
            )
          )
        }
      }

      await Promise.all(promises)
    },
  }
}

