import WebSocket from 'ws'

import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const createClientAdapter = ({ url, onEvent }) => {
  let client
  let isInitialized

  return {
    async init() {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      return await new Promise((resolve, reject) => {
        client = new WebSocket(url)

        client.on('open', () => {
          isInitialized = true
          resolve()
        })

        client.on('error', err => {
          reject(err)
        })

        client.on('message', message => {
          try {
            onEvent(JSON.parse(message).payload)
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(message)
          }
        })
      })
    },

    async close() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      isInitialized = false
      client.close()

      client = undefined
    },

    async subscribeToTopics(topics) {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      client.send({
        eventName: 'subscribe',
        data: JSON.stringify(topics)
      })
    },

    async unsubscribeFromTopics(topics) {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      client.send({
        eventName: 'unsubscribe',
        data: JSON.stringify(topics)
      })
    },

    isConnected() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return client.readyState === 1
    }
  }
}

createClientAdapter.adapterName = 'ws'

export default createClientAdapter
