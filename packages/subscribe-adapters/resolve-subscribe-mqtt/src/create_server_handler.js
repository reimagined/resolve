import getWebSocketStream from 'websocket-stream'
import MqttConnection from 'mqtt-connection'

import getMqttTopic from './get_mqtt_topic'

const createServerHandler = (pubsubManager, callback, appId, qos) => ws => {
  const stream = getWebSocketStream(ws)
  const client = new MqttConnection(stream)
  let messageId = 1

  const publisher = (topicName, topicId, event) =>
    new Promise((resolve, reject) => {
      console.log(topicName, topicId)
      console.log(event)
      console.log(typeof event)

      client.publish(
        {
          topic: getMqttTopic(appId, { topicName, topicId }),
          payload: JSON.stringify(event),
          messageId: messageId++,
          qos
        },
        error => (error ? reject(error) : resolve())
      )
    })

  client.on('connect', () => {
    client.connack({ returnCode: 0 })
    callback()
  })
  client.on('pingreq', () => client.pingresp())

  client.on('subscribe', packet => {
    for (const subscription of packet.subscriptions) {
      const [appId, topicName, topicId] = subscription.topic.split('/')
      pubsubManager.subscribe({ client: publisher, topicName, topicId })
    }
    client.suback({ granted: [packet.qos], messageId: packet.messageId })
  })

  client.on('unsubscribe', packet => {
    for (const unsubscription of packet.unsubscriptions) {
      const [appId, topicName, topicId] = unsubscription.topic.split('/')
      pubsubManager.unsubscribe({ client: publisher, topicName, topicId })
    }
    client.unsuback({ granted: [packet.qos], messageId: packet.messageId })
  })

  const dispose = () => {
    pubsubManager.unsubscribeClient(publisher)
    client.destroy()
  }

  client.on('close', dispose)
  client.on('error', dispose)
  client.on('disconnect', dispose)
}

export default createServerHandler
