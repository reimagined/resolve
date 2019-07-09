export default () => ({
  code: `
  import seedClientEnvs from '$resolve.seedClientEnvs'
  import storageAdapter from '$resolve.storageAdapter'
  import snapshotAdapter from '$resolve.snapshotAdapter'
  import readModelConnectors from '$resolve.readModelConnectors'
  import constants from '$resolve.constants'
  import apiHandlers from '$resolve.apiHandlers'
  import aggregates from '$resolve.aggregates'
  import readModels from '$resolve.readModels'
  import viewModels from '$resolve.viewModels'
  import sagas from '$resolve.sagas'
  import routes from '$resolve.routes'
  import redux from '$resolve.redux'

  export default {
    assemblies: {
      seedClientEnvs,
      storageAdapter,
      snapshotAdapter,
      readModelConnectors
    },
    constants,
    domain: {
      apiHandlers,
      aggregates,
      readModels,
      viewModels,
      sagas
    },
    routes,
    redux
  }
`
})
