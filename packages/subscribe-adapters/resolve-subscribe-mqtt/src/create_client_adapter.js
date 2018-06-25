import mqtt from 'mqtt'

import getMqttTopics from './get_mqtt_topics'

import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized
} from './constants'

const qos = 2

const createClientAdapter = ({ url, appId, onEvent }) => {
  let client
  let isInitialized

  return {
    async init() {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      return await new Promise((resolve, reject) => {
        client = mqtt.connect(url)

        client.on('connect', () => {
          isInitialized = true
          resolve()
        })

        client.on('error', err => {
          reject(err)
        })

        client.on('message', (topic, message) => {
          try {
            const event = JSON.parse(message.toString('utf8'))
            onEvent(event)
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(topic, message, error)
          }
        })
      })
    },

    async close() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      isInitialized = false
      client.end()

      client = undefined
    },

    async subscribeToTopics(topics) {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return await new Promise((resolve, reject) => {
        client.subscribe(getMqttTopics(appId, topics), { qos }, err => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    },

    async unsubscribeFromTopics(topics) {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return await new Promise((resolve, reject) => {
        client.unsubscribe(getMqttTopics(appId, topics), { qos }, err => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    },

    isConnected() {
      if (!isInitialized) {
        throw new Error(subscribeAdapterNotInitialized)
      }

      return client.connected
    }
  }
}

export default createClientAdapter
