import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const requestListenerResume = async (pool, listenerId, eventTypes) => {
  await pool.declareListenerEventTypes(listenerId, eventTypes)
  const encodedMessage = pool.encodePubContent(JSON.stringify({ listenerId }))
  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.RESUME_LISTENER_TOPIC} ${encodedMessage}`
  )

  await pool.doUpdateRequest(listenerId)
}

export default requestListenerResume
