import debugLevels from 'resolve-debug-levels'
import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const log = debugLevels(
  'resolve:resolve-local-event-broker:declare-listener-event-types'
)

const declareListenerEventTypes = async (pool, listenerId, eventTypes) => {
  try {
    const encodedMessage = pool.encodePubContent(
      JSON.stringify({
        listenerId,
        eventTypes
      })
    )

    await pool.pubSocket.send(
      `${CLIENT_TO_SERVER_TOPICS.DECLARE_EVENT_TYPES_TOPIC} ${encodedMessage}`
    )
  } catch (error) {
    log.error('Declaring event types for listenerId on bus failed', error)
  }
}

export default declareListenerEventTypes
