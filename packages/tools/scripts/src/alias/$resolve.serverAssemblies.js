const importServerAssemblies = () => ` 
  import '$resolve.guardOnlyServer'
  import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"
  import constants from '$resolve.constants'
  import resolveVersion from '$resolve.resolveVersion'

  const assemblies = Object.create(Object.prototype, {
    seedClientEnvs: { 
      get() { 
        return interopRequireDefault(require('$resolve.seedClientEnvs')).default
      },
      enumerable: true
    },
    eventstoreAdapter: {
      get() { 
        return interopRequireDefault(require('$resolve.eventstoreAdapter')).default
      },
      enumerable: true
    },
    readModelConnectors: {
      get() { 
        return interopRequireDefault(require('$resolve.readModelConnectors')).default
      },
      enumerable: true
    },
    serverImports: {
      get() { 
        return interopRequireDefault(require('$resolve.serverImports')).default
      },
      enumerable: true
    },
    uploadAdapter: {
      get() { 
        return interopRequireDefault(require('$resolve.uploadAdapter')).default
      },
      enumerable: true
    }
  })
  
  const domain = Object.create(Object.prototype, {
    apiHandlers: {
      get() { 
        return interopRequireDefault(require('$resolve.apiHandlers')).default
      },
      enumerable: true
    },
    aggregates: {
      get() { 
        return interopRequireDefault(require('$resolve.aggregates')).default
      },
      enumerable: true
    },
    readModels: {
      get() { 
        return interopRequireDefault(require('$resolve.readModels')).default
      },
      enumerable: true
    },
    viewModels: {
      get() { 
        return interopRequireDefault(require('$resolve.viewModels')).default
      },
      enumerable: true
    },
    sagas: {
      get() { 
        return interopRequireDefault(require('$resolve.sagas')).default
      },
      enumerable: true
    },
    middlewares: {
      get() { 
        return interopRequireDefault(require('$resolve.middlewares')).default
      },
      enumerable: true
    }
  })
  
  export default { 
    assemblies, 
    constants, 
    domain,
    resolveVersion
  } 
`

export default importServerAssemblies
