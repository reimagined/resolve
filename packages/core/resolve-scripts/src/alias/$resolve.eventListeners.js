export default () => `
  import '$resolve.guardOnlyServer'
  import { schedulerEventTypes } from 'resolve-saga'
  import readModels from '$resolve.readModels'
  import sagas from '$resolve.sagas'
  import schedulers from '$resolve.schedulers'

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
  
  for (const { name, invariantHash, connectorName } of schedulers) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.values(schedulerEventTypes({ schedulerName: name })),
      invariantHash,
      connectorName,
      isSaga: true
    })
  }

  export default eventListeners
`
