import http from 'http'
import https from 'https'
import { getLog } from '../common/utils/get-log'
import type { EventSubscriberNotifier } from '../common'

// TODO: add a test
// TODO: destination can be determined here too (see resolve.getEventSubscriberDestination)

const notifyEventSubscriber: EventSubscriberNotifier = async (
  destination,
  eventSubscriber,
  event?
) => {
  void event
  const log = getLog(`notifyEventSubscriber:${eventSubscriber}`)
  if (/^https?:\/\//.test(destination)) {
    await new Promise((resolve, reject) => {
      const req = (destination.startsWith('https') ? https : http).request(
        `${destination}/${eventSubscriber}`,
        (res) => {
          res.on('data', () => {
            return
          })
          res.on('end', resolve)
          res.on('error', reject)
        }
      )
      req.on('error', reject)
      req.end()
    })
  } else {
    log.warn(
      `event subscriber destination not supported by runtime: ${destination}`
    )
  }
}

export const eventSubscriberNotifierFactory = (): EventSubscriberNotifier =>
  notifyEventSubscriber
