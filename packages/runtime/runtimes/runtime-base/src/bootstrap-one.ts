import { getLog } from './utils'
import type { Runtime, EventListenersManagerParameters } from './types'

export const bootstrapOne = async ({
  applicationName,
  name,
  eventstoreAdapter,
  eventSubscriber,
  eventTypes,
  destination,
  upstream,
  ensureQueue,
  forceResume,
}: {
  applicationName: string
  name: string
  eventstoreAdapter: Runtime['eventStoreAdapter']
  eventSubscriber: Runtime['eventSubscriber']
  eventTypes: string[]
  destination?: string
  upstream: EventListenersManagerParameters['upstream']
  ensureQueue: EventListenersManagerParameters['ensureQueue']
  forceResume: boolean
}) => {
  const log = getLog(`bootstrapOne:${name}`)
  try {
    const errors = []
    try {
      await ensureQueue(name)
    } catch (err) {
      errors.push(err)
    }

    try {
      log.debug(`subscribing`)
      await eventSubscriber.subscribe({
        eventSubscriber: name,
        subscriptionOptions: { eventTypes },
        destination,
      })

      if (upstream || forceResume) {
        const sideEffectsKey = 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'
        log.debug(`requesting subscriber status`)
        const [status, sideEffectsValue] = await Promise.all([
          eventSubscriber
            .status({ eventSubscriber: name })
            .then((result: any) => (result != null ? result.status : result)),
          eventSubscriber.getProperty({
            eventSubscriber: name,
            key: sideEffectsKey,
          }),
        ])
        log.debug(`subscriber status [${status}]`)

        if (sideEffectsValue == null || sideEffectsValue === '') {
          log.debug(`setting side effects timestamp to date.now`)
          await eventSubscriber.setProperty({
            eventSubscriber: name,
            key: sideEffectsKey,
            value: `${Date.now()}`,
          })
        }

        if (status === 'deliver') {
          log.debug(`resuming event subscriber`)
          await eventSubscriber.resume({ eventSubscriber: name })
        }
      }
    } catch (err) {
      log.error(err)
      errors.push(err)
    }

    if (errors.length > 0) {
      const summaryError = new Error(
        errors.map(({ message }) => message).join('\n')
      )
      summaryError.stack = errors.map(({ stack }) => stack).join('\n')
      throw summaryError
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event subscriber "${name}" can't resume subscription due to error "${error.stack}"
    `)
  }
}
