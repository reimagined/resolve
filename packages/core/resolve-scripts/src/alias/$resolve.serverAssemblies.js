export default () => ({
  code: `
  import serverImports from '$resolve.serverImports'
  import seedClientEnvs from '$resolve.seedClientEnvs'
  import storageAdapter from '$resolve.storageAdapter'
  import snapshotAdapter from '$resolve.snapshotAdapter'
  import readModelConnectors from '$resolve.readModelConnectors'
  import constants from '$resolve.constants'
  import apiHandlers from '$resolve.apiHandlers'
  import eventListeners from '$resolve.eventListeners'
  import aggregates from '$resolve.aggregates'
  import readModels from '$resolve.readModels'
  import viewModels from '$resolve.viewModels'
  import sagas from '$resolve.sagas'
  import schedulers from '$resolve.schedulers'

  export default {
    assemblies: {
      seedClientEnvs,
      storageAdapter,
      snapshotAdapter,
      readModelConnectors,
      serverImports
    },
    constants,
    domain: {
      apiHandlers,
      eventListeners,
      aggregates,
      readModels,
      viewModels,
      schedulers,
      sagas
    }
  }
`
})
