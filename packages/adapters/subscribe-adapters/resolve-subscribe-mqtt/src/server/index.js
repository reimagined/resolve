import { Server as WebSocketServer } from 'ws'

import Url from 'url'

import createServerHandler from './create_server_handler'
import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const qos = 1

const createServerAdapter = ({
  server,
  getRootBasedUrl,
  pubsubManager,
  appId
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
            path: getRootBasedUrl('/api/mqtt')
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
    },

    async getOptions(origin) {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      const { protocol, hostname, port } = Url.parse(origin)

      const wsProtocol = /^https/.test(protocol) ? 'wss' : 'ws'

      const url = `${wsProtocol}://${hostname}:${port}${getRootBasedUrl(
        '/api/mqtt'
      )}`

      return {
        appId,
        url
      }
    }
  }
}

export default createServerAdapter
