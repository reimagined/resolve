import partial from 'lodash.partial'
import type { EventPointer } from '@resolve-js/core'
import type { Runtime, RuntimeFactoryParameters } from './types'
import { createEventSubscriberNotification, getLog } from './utils'

type NotifierRuntime = {
  getVacantTimeInMillis: RuntimeFactoryParameters['getVacantTimeInMillis']
  eventStoreAdapter: Runtime['eventStoreAdapter']
  eventListeners: RuntimeFactoryParameters['eventListeners']
  invokeBuildAsync: RuntimeFactoryParameters['invokeBuildAsync']
  eventSubscriberScope: RuntimeFactoryParameters['eventSubscriberScope']
  notifyEventSubscriber: RuntimeFactoryParameters['notifyEventSubscriber']
}

const broadcaster = async (runtime: NotifierRuntime, event?: EventPointer) => {
  const log = getLog(`notifyEventSubscribers`)
  const maxDuration = runtime.getVacantTimeInMillis()
  let timerId = null

  const timerPromise = new Promise((resolve) => {
    timerId = setTimeout(resolve, maxDuration)
  })

  const inlineLedgerPromise = (async () => {
    const promises = []
    for (const { name: eventSubscriber } of runtime.eventListeners.values()) {
      promises.push(
        runtime.invokeBuildAsync(
          createEventSubscriberNotification(eventSubscriber, event)
        )
      )
    }

    const eventSubscribers = await runtime.eventStoreAdapter.getEventSubscribers()
    await Promise.all(
      eventSubscribers
        .filter(
          ({ applicationName, eventSubscriber }) =>
            runtime.eventSubscriberScope !== applicationName ||
            !runtime.eventListeners.has(eventSubscriber)
        )
        .map(async ({ applicationName, eventSubscriber, destination }) => {
          try {
            await runtime.notifyEventSubscriber(
              destination,
              eventSubscriber,
              event
            )
          } catch (error) {
            log.warn(
              `Notify application "${applicationName}" event subscriber "${eventSubscriber}" failed with error: ${error}`
            )
          }
        })
    )

    if (timerId != null) {
      clearTimeout(timerId)
    }
  })()

  await Promise.race([timerPromise, inlineLedgerPromise])
}

export const eventBroadcastFactory = (runtime: NotifierRuntime) =>
  partial(broadcaster, runtime)
