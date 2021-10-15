import { getLog } from './utils/get-log'
import { bootstrapOne } from './bootstrap-one'
import { shutdownOne } from './shutdown-one'

import type {
  EventListeners,
  EventListenersManagerParameters,
  EventSubscriber,
} from './types'
import type { Adapter as EventStoreAdapter } from '@resolve-js/eventstore-base'

const log = getLog('bootstrap')

type BootstrapRuntime = {
  eventStoreAdapter: EventStoreAdapter
  eventListeners: EventListeners
  eventSubscriber: EventSubscriber
}

export const bootstrap = async (
  runtime: BootstrapRuntime,
  params: EventListenersManagerParameters,
  waitForReady: boolean
) => {
  log.debug('bootstrap started')
  const {
    upstream,
    eventSubscriberScope,
    getEventSubscriberDestination,
    ensureQueue,
    deleteQueue,
  } = params
  const { eventSubscriber, eventStoreAdapter, eventListeners } = runtime

  const promises = []

  log.debug(`enqueue ${eventListeners.size} new subscribers bootstrap`)
  for (const { name, eventTypes } of eventListeners.values()) {
    promises.push(
      bootstrapOne({
        applicationName: eventSubscriberScope,
        eventstoreAdapter: eventStoreAdapter,
        eventSubscriber,
        name,
        eventTypes,
        destination: getEventSubscriberDestination(name),
        upstream,
        ensureQueue,
        forceResume: waitForReady,
      })
    )
  }

  log.debug(`gathering orphaned subscribers`)
  const toShutdown = (
    await eventStoreAdapter.getEventSubscribers({
      applicationName: eventSubscriberScope,
    })
  )
    .map(({ eventSubscriber }) => eventSubscriber)
    .filter((name) => !eventListeners.has(name))

  log.debug(`${toShutdown.length} orphaned subscribers gathered`)

  for (const name of toShutdown) {
    promises.push(
      shutdownOne({
        eventSubscriberScope,
        eventStoreAdapter,
        eventSubscriber,
        name,
        upstream,
        deleteQueue,
        soft: true,
      })
    )
  }

  log.debug(`awaiting tasks to complete`)
  await Promise.all(promises)

  if (waitForReady && upstream) {
    log.debug(`start waiting subscribers ready state`)
    const notReadyListeners = new Set([...runtime.eventListeners.keys()])
    log.debug(`waiting for ${notReadyListeners.size} listeners`)

    while (upstream && notReadyListeners.size > 0) {
      for (const eventSubscriber of notReadyListeners) {
        const {
          successEvent,
          failedEvent,
          errors,
          status,
        } = await runtime.eventSubscriber.status({ eventSubscriber })

        if (
          successEvent != null ||
          failedEvent != null ||
          (Array.isArray(errors) && errors.length > 0) ||
          status !== 'deliver'
        ) {
          notReadyListeners.delete(eventSubscriber)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    log.debug(`all subscribers now ready`)
  }

  log.debug('bootstrap successful')
}
