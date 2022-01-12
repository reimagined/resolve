import partial from 'lodash.partial'
import type { EventPointer } from '@resolve-js/core'
import type { Runtime, RuntimeFactoryParameters } from './types'
import { createEventSubscriberNotification, getLog } from './utils'

export type NotifierRuntime = {
  getVacantTimeInMillis: () => number
  eventStoreAdapter: Runtime['eventStoreAdapter']
  eventListeners: RuntimeFactoryParameters['eventListeners']
  invokeBuildAsync: RuntimeFactoryParameters['invokeBuildAsync']
  eventSubscriberScope: RuntimeFactoryParameters['eventSubscriberScope']
  notifyEventSubscriber: RuntimeFactoryParameters['notifyEventSubscriber']
}

export const isMatchEventType = (
  eventTypes: Array<string> | null,
  eventType: string | null | undefined
) => eventTypes == null || eventType == null || eventTypes.includes(eventType)

export const broadcaster = async (
  runtime: NotifierRuntime,
  event?: EventPointer
) => {
  const log = getLog(`broadcaster:${event?.event.type ?? '_NO_EVENT_'}`)
  const maxDuration = runtime.getVacantTimeInMillis()
  let timerId = null

  log.debug(`begin event broadcast`)

  const timerPromise = new Promise((resolve) => {
    timerId = setTimeout(resolve, maxDuration)
  })
  const eventType = event?.event?.type

  const inlineLedgerPromise = (async () => {
    const promises = []
    for (const {
      name: eventSubscriber,
      eventTypes,
    } of runtime.eventListeners.values()) {
      if (!isMatchEventType(eventTypes, eventType)) {
        continue
      }
      promises.push(
        runtime.invokeBuildAsync(
          createEventSubscriberNotification(eventSubscriber, event)
        )
      )
    }

    const eventSubscribers = await runtime.eventStoreAdapter.getEventSubscribers()

    promises.push(
      ...eventSubscribers
        .filter(
          ({ applicationName, eventSubscriber }) =>
            runtime.eventSubscriberScope !== applicationName ||
            !runtime.eventListeners.has(eventSubscriber)
        )
        .map(
          async ({ applicationName, eventSubscriber, destination, status }) => {
            const eventTypes = Array.isArray(status?.eventTypes)
              ? (status?.eventTypes as Array<string>)
              : null
            if (!isMatchEventType(eventTypes, eventType)) {
              return
            }
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
          }
        )
    )

    await Promise.allSettled(promises)

    if (timerId != null) {
      clearTimeout(timerId)
    }
  })()

  await Promise.race([timerPromise, inlineLedgerPromise])
}

export const eventBroadcastFactory = (runtime: NotifierRuntime) =>
  partial(broadcaster, runtime)
