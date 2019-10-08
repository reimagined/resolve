export default () => ({
  code: `
  import { schedulerEventTypes } from 'resolve-saga'
  import readModels from '$resolve.readModels'
  import sagas from '$resolve.sagas'
  import schedulers from '$resolve.schedulers'

  const eventListeners = new Map()

  for (const { name, projection, invariantHash } of readModels) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(projection),
      invariantHash,
      isSaga: false
    })
  }

  for (const { name, handlers, invariantHash } of sagas) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.keys(handlers),
      invariantHash,
      isSaga: true
    })
  }
  
  for (const { name, invariantHash } of schedulers) {
    eventListeners.set(name, {
      name,
      eventTypes: Object.values(schedulerEventTypes(name)),
      invariantHash,
      isSaga: true
    })
  }

  export default eventListeners
`
})
