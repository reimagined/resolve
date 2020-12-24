export default () => `
  import '$resolve.guardOnlyServer'
  import { initDomain } from 'resolve-runtime-interop'
  import readModels from '$resolve.readModels'
  import sagas from '$resolve.sagas'

  const { 
    sagaDomain: { 
      getSchedulersNamesBySagas, schedulerInvariantHash, schedulerEventTypes 
    } 
  } = initDomain({ sagas })
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

  for(const schedulerName of getSchedulersNamesBySagas()) {
    eventListeners.set(\`\${schedulerName}\`, {
      name: \`\${schedulerName}\`,
      eventTypes: Object.values(schedulerEventTypes),
      invariantHash: schedulerInvariantHash,
      connectorName: schedulerName.connectorName,
      isSaga: true
    })
  }

  export default eventListeners
`
