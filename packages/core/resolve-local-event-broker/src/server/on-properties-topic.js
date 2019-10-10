import { SERVER_TO_CLIENT_TOPICS } from '../constants'

const onPropertiesTopic = async (pool, content) => {
  const { messageGuid, clientId, ...propertyAction } = JSON.parse(content)
  const encodedTopic = pool.encodeXpubTopic({
    listenerId: SERVER_TO_CLIENT_TOPICS.PROPERTIES_TOPIC,
    clientId
  })

  let result = null
  try {
    result = await pool.handlePropertyAction(pool, propertyAction)
  } catch (error) {
    result = error
  }

  const encodedContent = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      result
    })
  )

  await pool.xpubSocket.send(`${encodedTopic} ${encodedContent}`)
}

export default onPropertiesTopic
