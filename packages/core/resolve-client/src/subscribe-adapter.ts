import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './subscribe-adapter-constants'

export interface SubscribeAdapter {
  init: () => Promise<any>
  close: () => Promise<any>
  isConnected: () => boolean
}

export interface CreateSubscribeAdapter {
  (options: { url: string; onEvent: Function }): SubscribeAdapter
  adapterName: string
}

const createClientAdapter: CreateSubscribeAdapter = ({
  url,
  onEvent
}: {
  url: string
  onEvent: Function
}) => {
  let client: WebSocket | undefined
  let isInitialized: boolean

  return {
    async init(): Promise<void> {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      return await new Promise((resolve, reject) => {
        client = new WebSocket(url)

        client.onopen = (): void => {
          isInitialized = true
          resolve()
        }

        client.onmessage = (message): void => {
          try {
            onEvent(JSON.parse(message.data))
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('WebSocket message error', error)
          }
        }
      })
    },

    async close(): Promise<void> {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      isInitialized = false
      client.close()

      client = undefined
    },

    isConnected(): boolean {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return client.readyState === 1
    }
  }
}

createClientAdapter.adapterName = 'ws'

export default createClientAdapter
