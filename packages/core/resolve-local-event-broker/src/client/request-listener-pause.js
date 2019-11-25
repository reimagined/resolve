import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const requestListenerPause = async (pool, listenerId, eventTypes) => {
  await pool.declareListenerEventTypes(listenerId, eventTypes)
  const encodedMessage = pool.encodePubContent(JSON.stringify({ listenerId }))
  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.PAUSE_LISTENER_TOPIC} ${encodedMessage}`
  )
}

export default requestListenerPause
