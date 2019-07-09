import { OUTCOMING_TOPICS } from './constants'

const onInformationTopic = async (pool, content) => {
  const { messageGuid, listenerId, clientId } = JSON.parse(content)
  const encodedTopic = pool.encodeXpubTopic({
    listenerId: OUTCOMING_TOPICS.INFORMATION_TOPIC,
    clientId
  })

  const information = await pool.getListenerInfo(listenerId, true)

  const encodedContent = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      information
    })
  )

  await pool.xpubSocket.send(`${encodedTopic} ${encodedContent}`)
}

export default onInformationTopic
