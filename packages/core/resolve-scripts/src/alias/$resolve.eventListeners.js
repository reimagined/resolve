export default () => `
  import '$resolve.guardOnlyServer'
  import { schedulerName, schedulerEventTypes, schedulerInvariantHash } from 'resolve-saga'
  import readModels from '$resolve.readModels'
  import sagas from '$resolve.sagas'

  const eventListeners = new Map()

  for (const { name, projection, invariantHash, connectorName } of readModels) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(projection),
      invariantHash,
      connectorName,
      isSaga: false
    })
  }

  for (const { name, handlers, invariantHash, connectorName } of sagas) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(handlers),
      invariantHash,
      connectorName,
      isSaga: true
    })
  }

  const uniqueSagaConnectorsNames = Array.from(new Set(sagas.map(saga => saga.connectorName)))
  for(const connectorName of uniqueSagaConnectorsNames) {
    const name = '' + schedulerName + connectorName
    eventListeners.set(name, {
      name,
      eventTypes: Object.values(schedulerEventTypes),
      invariantHash: schedulerInvariantHash,
      connectorName,
      isSaga: true
    })
  }

  export default eventListeners
`
