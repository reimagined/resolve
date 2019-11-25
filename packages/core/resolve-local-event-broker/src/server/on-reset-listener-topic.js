import { SERVER_TO_CLIENT_TOPICS, LOCK_PROMISE_BASE_NAME } from '../constants'

const onResetListenerTopic = async (pool, content) => {
  const { messageGuid, listenerId, clientId } = JSON.parse(content)
  const lockName = `${LOCK_PROMISE_BASE_NAME}${listenerId}`
  const unlock = await pool.interlockPromise(pool, lockName)

  try {
    const encodedTopic = pool.encodeXpubTopic({
      listenerId: SERVER_TO_CLIENT_TOPICS.RESET_LISTENER_ACKNOWLEDGE_TOPIC,
      clientId
    })

    await pool.rewindListener(listenerId)

    const encodedContent = pool.encodePubContent(
      JSON.stringify({
        messageGuid
      })
    )

    await pool.xpubSocket.send(`${encodedTopic} ${encodedContent}`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error while resetting listener', error)
  }

  unlock()
}

export default onResetListenerTopic
