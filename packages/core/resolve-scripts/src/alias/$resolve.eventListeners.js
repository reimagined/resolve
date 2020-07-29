export default () => `
  import '$resolve.guardOnlyServer'
  import { schedulerEventTypes } from 'resolve-saga'
  import readModels from '$resolve.readModels'
  import sagas from '$resolve.sagas'
  import schedulers from '$resolve.schedulers'

  const eventListeners = new Map()

  for (const { name, projection, invariantHash, connectorName, classifier } of readModels) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(projection),
      invariantHash,
      connectorName,
      classifier,
      isSaga: false
    })
  }

  for (const { name, handlers, invariantHash, connectorName, classifier } of sagas) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(handlers),
      invariantHash,
      connectorName,
      classifier,
      isSaga: true
    })
  }
  
  for (const { name, invariantHash, connectorName } of schedulers) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.values(schedulerEventTypes({ schedulerName: name })),
      invariantHash,
      connectorName,
      classifier: null,
      isSaga: true
    })
  }

  export default eventListeners
`
