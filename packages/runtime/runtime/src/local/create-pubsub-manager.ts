import type { Event } from '@resolve-js/core'
export type Publisher = (message: string) => Promise<void>

export type Connection = {
  publisher: Publisher
  eventTypes: string[]
  aggregateIds: string[]
}

export type PubSubManager = {
  connect: (connectionId: string, subscription: Connection) => void
  disconnect: (connectionId: string) => void
  getConnection: (connectionId: string) => Connection | undefined
  dispatch: (event: Event) => Promise<void>
}

export const createPubSubManager = () => {
  const map = new Map<string, Connection>()

  const pubSubManager: PubSubManager = {
    connect(connectionId, subscription) {
      if (!map.has(connectionId)) {
        map.set(connectionId, subscription)
      }
    },

    disconnect(connectionId) {
      if (!map.has(connectionId)) {
        return
      }

      map.delete(connectionId)
    },

    getConnection(connectionId) {
      return map.get(connectionId)
    },

    async dispatch(event: Event) {
      const promises: Promise<void>[] = []
      const { type, aggregateId } = event

      map.forEach(({ eventTypes, aggregateIds, publisher }) => {
        if (
          (eventTypes == null || eventTypes?.includes?.(type)) &&
          (aggregateIds == null || aggregateIds?.includes?.(aggregateId))
        ) {
          promises.push(
            publisher(
              JSON.stringify({ type: 'events', payload: { events: [event] } })
            )
          )
        }
      })

      await Promise.all(promises)
    },
  }

  return pubSubManager
}
