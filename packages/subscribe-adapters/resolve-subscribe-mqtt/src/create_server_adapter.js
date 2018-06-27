import { Server as WebSocketServer } from 'ws'

import createServerHandler from './create_server_handler'
import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const createServerAdapter = ({
  server,
  getRootBasedUrl,
  pubsubManager,
  appId,
  qos
}) => {
  let isInitialized = false
  let socketMqttServer = null

  return {
    async init() {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      isInitialized = true

      return new Promise((resolve, reject) => {
        socketMqttServer = new WebSocketServer(
          {
            server,
            path: getRootBasedUrl('/mqtt')
          },
          error => (error ? reject(error) : resolve())
        )

        const handler = createServerHandler(pubsubManager, resolve, appId, qos)

        socketMqttServer.on('connection', handler)
      })
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
    }
  }
}

export default createServerAdapter
