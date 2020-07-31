import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const createClientAdapter = ({
  url,
  onEvent
}: {
  url: string
  onEvent: Function
}) => {
  let client: WebSocket | undefined
  let isInitialized: boolean

  return {
    async init() {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      return await new Promise((resolve, reject) => {
        client = new WebSocket(url)

        client.onopen = () => {
          isInitialized = true
          resolve()
        }

        client.onmessage = message => {
          try {
            onEvent(JSON.parse(message.data))
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('WebSocket message error', error)
          }
        }
      })
    },

    async close() {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      isInitialized = false
      client.close()

      client = undefined
    },

    isConnected() {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return client.readyState === 1
    }
  }
}

createClientAdapter.adapterName = 'ws'

export default createClientAdapter
