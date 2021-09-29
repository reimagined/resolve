import type { Domain, DomainMeta } from '@resolve-js/core'
import type { EventListener } from './types'

export const gatherEventListeners = (
  domain: DomainMeta,
  domainInterop: Domain
) => {
  const { sagas, readModels } = domain
  const {
    sagaDomain: {
      getSagasSchedulersInfo,
      schedulerInvariantHash,
      schedulerEventTypes,
    },
  } = domainInterop
  const eventListeners = new Map<string, EventListener>()

  for (const { name, projection, invariantHash, connectorName } of readModels) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(projection),
      invariantHash,
      connectorName,
      isSaga: false,
    })
  }

  for (const { name, handlers, invariantHash, connectorName } of sagas) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(handlers),
      invariantHash,
      connectorName,
      isSaga: true,
    })
  }

  for (const scheduler of getSagasSchedulersInfo()) {
    eventListeners.set(scheduler.name, {
      name: scheduler.name,
      eventTypes: Object.values(schedulerEventTypes),
      invariantHash: schedulerInvariantHash,
      connectorName: scheduler.connectorName,
      isSaga: true,
    })
  }

  return eventListeners
}
