import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const publishEvent = async (pool, event) => {
  const encodedMessage = pool.encodePubContent(JSON.stringify({ event }))
  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.EVENT_TOPIC} ${encodedMessage}`
  )
}

export default publishEvent
