import { SERVER_TO_CLIENT_TOPICS } from '../constants'

const RESERVED_TOPIC_NAMES = Object.values(SERVER_TO_CLIENT_TOPICS)

const onXpubMessage = async (pool, message) => {
  let followTopicPromise = Promise.resolve()

  try {
    if (!(message instanceof Buffer)) {
      throw new Error('Message should be instance of Buffer')
    }
    const topic = message.toString('utf8', 1)
    const { listenerId, clientId } = pool.decodeXpubTopic(topic)
    const isConnection = message[0] === 1

    if (RESERVED_TOPIC_NAMES.includes(listenerId)) {
      return
    }

    if (!pool.clientMap.has(listenerId)) {
      pool.clientMap.set(listenerId, new Set())
      followTopicPromise = pool.followTopic(pool, listenerId)
    }

    const listenerSet = pool.clientMap.get(listenerId)
    listenerSet[isConnection ? 'add' : 'delete'](clientId)

    if (listenerSet.size === 0) {
      pool.clientMap.delete(listenerId)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      'Error while handling subscription/unsubscription xpub message',
      error
    )
  }

  await followTopicPromise
}

export default onXpubMessage
