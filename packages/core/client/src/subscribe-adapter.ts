import { v4 as uuid } from 'uuid'

import {
  pullEventsMaxAttempts,
  pullEventsTimeout,
  subscriptionAdapterAlreadyInitialized,
  subscriptionAdapterClosed,
  subscriptionAdapterNotInitialized,
} from './subscribe-adapter-constants'

import { SubscriptionAdapterStatus } from './types'
import {
  ReadModelSubscriptionParams,
  SubscriptionHandler,
  ViewModelSubscriptionParams,
} from './client'
import { isViewModelSubscriptionParams } from './utils'

export type SubscriptionAdapter = {
  init: () => void
  close: () => void
  status: () => SubscriptionAdapterStatus
}

export type SubscriptionAdapterFactory = (
  params: ViewModelSubscriptionParams | ReadModelSubscriptionParams,
  handler: SubscriptionHandler
) => SubscriptionAdapter

// TODO: refactor

const createViewModelSubscriptionAdapter = (
  params: ViewModelSubscriptionParams,
  handler: SubscriptionHandler
): SubscriptionAdapter => {
  const { cursor, url } = params

  let client: WebSocket | undefined
  let status: SubscriptionAdapterStatus = SubscriptionAdapterStatus.Initializing
  let currentCursor: string | null = cursor
  let pullEventsRequestId: string | null = null
  let pullEventsTimeoutInstance: ReturnType<typeof setTimeout> | null = null
  let isWaitingForExtraPulling = false

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
        if (pullEventsRequestId != null) {
          isWaitingForExtraPulling = true
        } else if (client != null) {
          pullEventsRequestId = uuid()

          client.send(
            JSON.stringify({
              type: 'pullEvents',
              requestId: pullEventsRequestId,
              payload: {
                cursor: currentCursor,
              },
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
          const { type, requestId, payload } = JSON.parse(message.data)

          switch (type) {
            case 'events': {
              tryToSendPullEventsRequest()
              break
            }
            case 'pullEvents': {
              if (requestId === pullEventsRequestId) {
                payload.events.forEach((event: any) => {
                  handler(event)
                })
                currentCursor = payload.cursor
                pullEventsRequestId = null

                if (pullEventsTimeoutInstance != null) {
                  clearTimeout(pullEventsTimeoutInstance)
                  pullEventsTimeoutInstance = null
                }

                if (isWaitingForExtraPulling) {
                  isWaitingForExtraPulling = false
                  tryToSendPullEventsRequest()
                }
              }
              break
            }
            default: {
              // eslint-disable-next-line no-console
              console.warn(`Unknown '${type}' socket message type`)
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

const createReadModelSubscriptionAdapter = (
  params: ReadModelSubscriptionParams,
  handler: SubscriptionHandler
): SubscriptionAdapter => {
  const { url, channel, readModelName } = params

  let client: WebSocket | undefined
  let status: SubscriptionAdapterStatus = SubscriptionAdapterStatus.Initializing

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
      }

      client.onmessage = (message): void => {
        try {
          const notification = JSON.parse(message.data)

          handler({
            readModelName,
            channel,
            notification,
          })
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

export const createSubscriptionAdapter: SubscriptionAdapterFactory = (
  params: ViewModelSubscriptionParams | ReadModelSubscriptionParams,
  handler: SubscriptionHandler
) => {
  if (isViewModelSubscriptionParams(params)) {
    return createViewModelSubscriptionAdapter(params, handler)
  } else {
    return createReadModelSubscriptionAdapter(params, handler)
  }
}
