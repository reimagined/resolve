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
  eventSubscriber: Runtime['eventSubscriber']
}

export const isMatchEventType = (
  eventTypes: Array<string> | null,
  eventType: string | null | undefined
) => eventTypes == null || eventType == null || eventTypes.includes(eventType)

const GET_READ_MODEL_STATUS_TIMEOUT = 300

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
        (async () => {
          let isAlreadyBuilding = false

          try {
            isAlreadyBuilding = Boolean(
              await Promise.race([
                (async () => {
                  const status = await runtime.eventSubscriber.status({
                    eventSubscriber,
                    includeRuntimeStatus: true,
                    retryTimeoutForRuntimeStatus: 0,
                  })

                  return status.isAlive
                })(),
                new Promise((resolve) =>
                  setTimeout(resolve, GET_READ_MODEL_STATUS_TIMEOUT)
                ),
              ])
            )
          } catch (e) {
            // empty
          }

          if (!isAlreadyBuilding) {
            await runtime.invokeBuildAsync(
              createEventSubscriberNotification(eventSubscriber, event)
            )
          }
        })()
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
