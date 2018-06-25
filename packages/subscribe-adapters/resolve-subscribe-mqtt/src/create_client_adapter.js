import mqtt from 'mqtt'

import getMqttTopics from './get_mqtt_topics'

import { errorMessageNotInitialized, errorMessageAlreadyInitialized } from './constants'

const createClientAdapter = ({ subscribeId, onEvent, api }) => {
  let client, qos, url, appId
  let isInitialized

  return {
    async init() {
      if (isInitialized) {
        throw new Error(errorMessageAlreadyInitialized)
      }

      const options = await api.getSubscribeAdapterOptions()
      qos = options.qos
      url = options.url
      appId = options.appId

      return await new Promise((resolve, reject) => {
        client = mqtt.connect(
          url,
          {
            clientId: subscribeId
          }
        )

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
        throw new Error(errorMessageNotInitialized)
      }
      isInitialized = false
      client.end()

      client = undefined
      qos = undefined
      url = undefined
      appId = undefined
    },

    async subscribeToTopics(topics) {
      if (!isInitialized) {
        throw new Error(errorMessageNotInitialized)
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
        throw new Error(errorMessageNotInitialized)
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
        throw new Error(errorMessageNotInitialized)
      }

      return client.connected
    }
  }
}

export default createClientAdapter
