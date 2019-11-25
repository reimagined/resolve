import { SERVER_TO_CLIENT_TOPICS } from '../constants'

const processIncomingMessages = async (pool, byteMessage) => {
  const message = byteMessage.toString('utf8')
  const payloadIndex = message.indexOf(' ') + 1
  const encodedTopic = message.substring(0, payloadIndex - 1)
  const encodedContent = message.substr(payloadIndex)

  const { listenerId, clientId } = pool.decodeXsubTopic(encodedTopic)
  const content = pool.decodeXsubContent(encodedContent)

  if (clientId !== pool.instanceId) {
    throw new Error(
      `Instance ${pool.instanceId} has received message addressed to ${clientId}`
    )
  }

  switch (listenerId) {
    case SERVER_TO_CLIENT_TOPICS.RESET_LISTENER_ACKNOWLEDGE_TOPIC:
      return await pool.processResetListenerAcknowledge(content)
    case SERVER_TO_CLIENT_TOPICS.INFORMATION_TOPIC:
      return await pool.processInformation(content)
    case SERVER_TO_CLIENT_TOPICS.PROPERTIES_TOPIC:
      return await pool.processProperties(content)
    default:
      return await pool.processEvents(listenerId, content)
  }
}

export default processIncomingMessages
