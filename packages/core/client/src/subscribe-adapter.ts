import { v4 as uuid } from 'uuid'

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
    pullEventsTimeout?: number
    pullEventsMaxAttempts?: number
  }): SubscriptionAdapter
  adapterName: string
}

const createClientAdapter: SubscriptionAdapterFactory = ({
  url,
  cursor,
  onEvent,
  pullEventsTimeout = 30000,
  pullEventsMaxAttempts = 10,
}) => {
  let client: WebSocket | undefined
  let status: SubscriptionAdapterStatus = SubscriptionAdapterStatus.Initializing
  let currentCursor: string | null = cursor
  let pullEventsRequestId: string | null = null
  let pullEventsTimeoutInstance: ReturnType<typeof setTimeout> | null = null

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

      const tryToSendPullEventsRequest = (attempts = pullEventsMaxAttempts) => {
        if (pullEventsRequestId == null && client != null) {
          pullEventsRequestId = uuid()

          client.send(
            JSON.stringify({
              type: 'pullEvents',
              cursor: currentCursor,
              requestId: pullEventsRequestId,
            })
          )

          pullEventsTimeoutInstance = setTimeout(() => {
            pullEventsRequestId = null

            if (attempts > 1) {
              tryToSendPullEventsRequest(attempts - 1)
            } else {
              // eslint-disable-next-line no-console
              console.warn(`WebSocket pullEvents max attempts reached out`)
              pullEventsTimeoutInstance = null
            }
          }, pullEventsTimeout)
        }
      }

      client.onopen = (): void => {
        status = SubscriptionAdapterStatus.Connected
        tryToSendPullEventsRequest()
      }

      client.onmessage = (message): void => {
        try {
          const data = JSON.parse(message.data)

          switch (data.type) {
            case 'event': {
              tryToSendPullEventsRequest()
              break
            }
            case 'pullEvents': {
              if (data.payload.requestId === pullEventsRequestId) {
                data.payload.events.forEach((event: any) => {
                  onEvent(event)
                })
                currentCursor = data.payload.cursor
                pullEventsRequestId = null

                if (pullEventsTimeoutInstance != null) {
                  clearTimeout(pullEventsTimeoutInstance)
                  pullEventsTimeoutInstance = null
                }
              }
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
      pullEventsRequestId = null

      if (pullEventsTimeoutInstance != null) {
        clearTimeout(pullEventsTimeoutInstance)
        pullEventsTimeoutInstance = null
      }
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
