import type { Event, Serializable } from '@resolve-js/core'
export type Publisher = (message: string) => Promise<void>

type Connection = {
  publisher: Publisher
}

export type ReadModelNotification = Serializable

export type ReadModelConnection = Connection & {
  name: string
  channel: string
}

export type ViewModelConnection = Connection & {
  eventTypes: string[]
  aggregateIds: string[]
}

export type PubSubManager = {
  connect: (
    connectionId: string,
    connection: ViewModelConnection | ReadModelConnection
  ) => void
  disconnect: (connectionId: string) => void
  getConnection: (
    connectionId: string
  ) => ViewModelConnection | ReadModelConnection | undefined
  dispatchEvent: (event: Event) => Promise<void>
  dispatchReadModelNotification: (
    name: string,
    channel: string,
    notification: ReadModelNotification
  ) => Promise<void>
}

const isReadModelConnection = (
  connection: any
): connection is ReadModelConnection => connection.channel != null

export const createPubSubManager = () => {
  const viewModelConnections = new Map<string, ViewModelConnection>()
  const readModelConnections = new Map<string, ReadModelConnection>()

  const pubSubManager: PubSubManager = {
    connect(connectionId, connection) {
      if (isReadModelConnection(connection)) {
        if (!readModelConnections.has(connectionId)) {
          readModelConnections.set(connectionId, connection)
        }
      } else {
        if (!viewModelConnections.has(connectionId)) {
          viewModelConnections.set(connectionId, connection)
        }
      }
    },

    disconnect(connectionId) {
      if (viewModelConnections.has(connectionId)) {
        viewModelConnections.delete(connectionId)
        return
      }
      if (readModelConnections.has(connectionId)) {
        readModelConnections.delete(connectionId)
      }
    },

    getConnection(connectionId) {
      return (
        viewModelConnections.get(connectionId) ??
        readModelConnections.get(connectionId)
      )
    },

    async dispatchEvent(event: Event) {
      const promises: Promise<void>[] = []
      const { type, aggregateId } = event
      const payload = JSON.stringify({
        type: 'events',
        payload: { events: [event] },
      })

      viewModelConnections.forEach(
        ({ eventTypes, aggregateIds, publisher }) => {
          if (
            (eventTypes == null || eventTypes?.includes?.(type)) &&
            (aggregateIds == null || aggregateIds?.includes?.(aggregateId))
          ) {
            promises.push(publisher(payload))
          }
        }
      )

      await Promise.all(promises)
    },

    async dispatchReadModelNotification(
      name: string,
      channel: string,
      notification: ReadModelNotification
    ) {
      const promises: Promise<void>[] = []
      const payload = JSON.stringify(notification)

      readModelConnections.forEach(
        ({ name: currentName, channel: currentChannel, publisher }) => {
          if (channel === currentChannel && name === currentName) {
            promises.push(publisher(payload))
          }
        }
      )

      await Promise.all(promises)
    },
  }

  return pubSubManager
}
