import getWebSocketStream from 'websocket-stream'
import MqttConnection from 'mqtt-connection'

const createServerHandler = ({ pubsubManager }) => ws => {
  const stream = getWebSocketStream(ws)
  const client = new MqttConnection(stream)
  const publisher = client.publish.bind(client)

  client.on('connect', () => client.connack({ returnCode: 0 }))
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

  client.on('close', () => client.destroy())
  client.on('error', () => client.destroy())
  client.on('disconnect', () => client.destroy())
}

export default createServerHandler
