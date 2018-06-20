import mqtt from 'mqtt'

import getMqttTopics from './get_mqtt_topics'

export const errorMessage = 'Subscribe adapter not initialized'

const createSubscribeAdapter = ({ api }) => {
  let client, qos, url, appId
  let isInitialized

  let onError

  return {
    async init() {
      onError = () => {}

      const options = await api.getSubscribeAdapterOptions()
      qos = options.qos
      url = options.url
      appId = options.appId

      return await new Promise((resolve, reject) => {
        client = mqtt.connect(url)

        onError = reject

        client.on('connect', () => {
          isInitialized = true
          onError = () => {}
          resolve()
        })

        client.on('error', err => {
          onError(err)
        })
      })
    },

    async close() {
      isInitialized = false
      client.end()

      client = undefined
      qos = undefined
      url = undefined
      appId = undefined
      onError = undefined
    },

    async subscribeToTopics(topics) {
      if (!isInitialized) {
        throw new Error(errorMessage)
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
        throw new Error(errorMessage)
      }

      return await new Promise((resolve, reject) => {
        client.unsubscribe(getMqttTopics(appId, topics), { qos }, err => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    }
  }
}

export default createSubscribeAdapter
