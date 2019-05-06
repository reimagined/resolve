import { OUTCOMING_TOPICS } from './constants'

const onPropertiesTopic = async (pool, content) => {
  const { messageGuid, clientId, ...propertyAction } = JSON.parse(content)
  const encodedTopic = pool.encodeXpubTopic({
    listenerId: OUTCOMING_TOPICS.PROPERTIES_TOPIC,
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
