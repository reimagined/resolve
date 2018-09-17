import createSocketServer from 'socket.io'

import createServerHandler from './create_server_handler'
import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const createServerAdapter = () => ({
  server,
  getRootBasedUrl,
  pubsubManager
}) => {
  let isInitialized = false
  let socketMqttServer = null

  return {
    async init() {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      isInitialized = true

      const handler = createServerHandler(pubsubManager)

      socketMqttServer = createSocketServer(server, {
        path: getRootBasedUrl('/api/socket-io/'),
        serveClient: false
      })

      socketMqttServer.on('connection', handler)

      return Promise.resolve()
    },

    async close() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return new Promise((resolve, reject) => {
        socketMqttServer.close(error => (error ? reject(error) : resolve()))

        socketMqttServer = null

        isInitialized = false
      })
    },

    async getOptions() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return {
        url: '/api/socket-io/'
      }
    }
  }
}

export default createServerAdapter
