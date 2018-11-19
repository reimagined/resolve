import socketIOClient from 'socket.io-client'

import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const createClientAdapter = ({ origin, rootPath, url, onEvent }) => {
  let client
  let isInitialized

  return {
    async init() {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      return await new Promise((resolve, reject) => {
        client = socketIOClient(origin, {
          path: `${rootPath ? `/${rootPath}` : ''}${url}`
        })

        client.on('connect', () => {
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

      client.emit('subscribe', JSON.stringify(topics))
    },

    async unsubscribeFromTopics(topics) {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      client.emit('unsubscribe', JSON.stringify(topics))
    },

    isConnected() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return client.connected
    }
  }
}

createClientAdapter.adapterName = 'socket.io'

export default createClientAdapter
