import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const createClientAdapter = ({
  url,
  appId,
  onEvent
}: {
  url: string
  appId: string
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

        client.onerror = err => {
          reject(err)
        }

        client.onmessage = message => {
          console.log('on message', message)
          try {
            onEvent(message.data.payload)
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(message)
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

    async subscribeToTopics(topics: object) {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      client.send(
        JSON.stringify({
          eventName: 'subscribe',
          applicationId: appId,
          data: topics
        })
      )
    },

    async unsubscribeFromTopics(topics: object) {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      client.send(
        JSON.stringify({
          eventName: 'unsubscribe',
          applicationId: appId,
          data: topics
        })
      )
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
