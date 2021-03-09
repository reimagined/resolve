import {
  subscriptionAdapterAlreadyInitialized,
  subscriptionAdapterClosed,
  subscriptionAdapterNotInitialized,
} from './subscribe-adapter-constants'
import { SubscriptionAdapterStatus } from './types'

export interface SubscriptionAdapter {
  init: () => void
  close: () => void
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
      if (
        status === SubscriptionAdapterStatus.Connecting ||
        status === SubscriptionAdapterStatus.Connected
      ) {
        throw new Error(subscriptionAdapterAlreadyInitialized)
      }
      if (status === SubscriptionAdapterStatus.Closed) {
        throw new Error(subscriptionAdapterClosed)
      }

      client = new WebSocket(url)
      status = SubscriptionAdapterStatus.Connecting

      client.onopen = (): void => {
        status = SubscriptionAdapterStatus.Connected

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

    close(): void {
      if (
        status !== SubscriptionAdapterStatus.Connecting &&
        status !== SubscriptionAdapterStatus.Connected
      ) {
        throw new Error(`${subscriptionAdapterNotInitialized}: ${status}`)
      }
      status = SubscriptionAdapterStatus.Closed
      if (client != null) {
        client.close()
      }
      client = undefined
    },

    status(): SubscriptionAdapterStatus {
      if (
        status === SubscriptionAdapterStatus.Connected &&
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
