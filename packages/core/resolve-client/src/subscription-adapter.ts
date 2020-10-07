import {
  subscriptionAdapterNotInitialized,
  subscriptionAdapterAlreadyInitialized,
  subscriptionAdapterClosed,
} from './subscribe-adapter-constants'

export enum SubscriptionAdapterStatus {
  Initializing = 'initializing',
  Connecting = 'connecting',
  Ready = 'ready',
  Closed = 'closed',
}

export interface SubscriptionAdapter {
  init: () => void
  close: () => Promise<any>
  status: () => SubscriptionAdapterStatus
}

export interface SubscriptionAdapterFactory {
  (options: {
    url: string
    cursor: string | null
    onEvent: Function
  }): SubscriptionAdapter
  adapterName: string
}

const createClientAdapter: SubscriptionAdapterFactory = ({
  url,
  cursor,
  onEvent,
}) => {
  let client: WebSocket | undefined
  let status: SubscriptionAdapterStatus = SubscriptionAdapterStatus.Initializing
  let currentCursor: string | undefined

  return {
    init(): void {
      if (status === SubscriptionAdapterStatus.Ready) {
        throw new Error(subscriptionAdapterAlreadyInitialized)
      }
      if (status === SubscriptionAdapterStatus.Closed) {
        throw new Error(subscriptionAdapterClosed)
      }

      client = new WebSocket(url)

      client.onopen = (): void => {
        status = SubscriptionAdapterStatus.Connecting

        client?.send(
          JSON.stringify({
            type: 'pullEvents',
            cursor,
          })
        )
      }

      client.onmessage = (message): void => {
        try {
          const data = JSON.parse(message.data)

          switch (data.type) {
            case 'event': {
              client?.send(
                JSON.stringify({
                  type: 'pullEvents',
                  cursor: currentCursor,
                })
              )
              break
            }
            case 'pullEvents': {
              data.payload.events.forEach((event: any) => {
                onEvent(event)
              })
              currentCursor = data.payload.cursor
              break
            }
            default: {
              // eslint-disable-next-line no-console
              console.warn(`Unknown '${data.type}' socket message type`)
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('WebSocket message error', error)
        }
      }
    },

    async close(): Promise<void> {
      if (status !== SubscriptionAdapterStatus.Connecting) {
        throw new Error(subscriptionAdapterNotInitialized)
      }
      status = SubscriptionAdapterStatus.Closed
      if (client != null) {
        client.close()
      }
      client = undefined
    },

    status(): SubscriptionAdapterStatus {
      if (
        status === SubscriptionAdapterStatus.Connecting &&
        client != null &&
        client.readyState === 1
      ) {
        return SubscriptionAdapterStatus.Ready
      }
      return status
    },
  }
}

createClientAdapter.adapterName = 'ws'

export default createClientAdapter
