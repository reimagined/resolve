import { SERVER_TO_CLIENT_TOPICS } from '../constants'

const onInformationTopic = async (pool, content) => {
  const { messageGuid, listenerId, clientId } = JSON.parse(content)
  const encodedTopic = pool.encodeXpubTopic({
    listenerId: SERVER_TO_CLIENT_TOPICS.INFORMATION_TOPIC,
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
