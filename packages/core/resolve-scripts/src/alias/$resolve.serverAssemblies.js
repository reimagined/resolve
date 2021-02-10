export default () => `
  import '$resolve.guardOnlyServer'
  import serverImports from '$resolve.serverImports'
  import seedClientEnvs from '$resolve.seedClientEnvs'
  import eventstoreAdapter from '$resolve.eventstoreAdapter'
  import readModelConnectors from '$resolve.readModelConnectors'
  import constants from '$resolve.constants'
  import apiHandlers from '$resolve.apiHandlers'
  import aggregates from '$resolve.aggregates'
  import readModels from '$resolve.readModels'
  import viewModels from '$resolve.viewModels'
  import sagas from '$resolve.sagas'
  import uploadAdapter from '$resolve.uploadAdapter'

  export default {
    assemblies: {
      seedClientEnvs,
      eventstoreAdapter,
      readModelConnectors,
      serverImports,
      uploadAdapter
    },
    constants,
    domain: {
      apiHandlers,
      aggregates,
      readModels,
      viewModels,
      sagas
    }
  }
`
