import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const onSubMessage = async (pool, byteMessage) => {
  const message = byteMessage.toString('utf8')
  const payloadIndex = message.indexOf(' ') + 1
  const topicName = message.substring(0, payloadIndex - 1)
  const encodedContent = message.substring(payloadIndex)
  const content = Buffer.from(encodedContent, 'base64').toString('utf8')

  try {
    switch (topicName) {
      case CLIENT_TO_SERVER_TOPICS.DECLARE_EVENT_TYPES_TOPIC:
        return await pool.onDeclareEventTypesTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.EVENT_TOPIC:
        return await pool.onEventTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.RESET_LISTENER_TOPIC:
        return await pool.onResetListenerTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.PAUSE_LISTENER_TOPIC:
        return await pool.onPauseListenerTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.RESUME_LISTENER_TOPIC:
        return await pool.onResumeListenerTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC:
        return await pool.onAcknowledgeBatchTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.INFORMATION_TOPIC:
        return await pool.onInformationTopic(pool, content)
      case CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC:
        return await pool.onPropertiesTopic(pool, content)
      default:
        throw new Error(`Unknown sub topic: ${topicName}`)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error while handling incoming sub message', error)
  }
}

export default onSubMessage
