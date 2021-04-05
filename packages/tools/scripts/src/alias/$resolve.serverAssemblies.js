export default () => ` 
  import '$resolve.guardOnlyServer'
  import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"
  import constants from '$resolve.constants'

  const assemblies = Object.create(null, {
    seedClientEnvs: { 
      get() { 
        return require('$resolve.seedClientEnvs').default
      }
    },
    eventstoreAdapter: {
      get() { 
        return require('$resolve.eventstoreAdapter').default
      } 
    },
    readModelConnectors: {
      get() { 
        return require('$resolve.readModelConnectors').default
      }
    },
    serverImports: {
      get() { 
        return require('$resolve.serverImports').default
      }
    },
    uploadAdapter: {
      get() { 
        return require('$resolve.uploadAdapter').default
      }
    }
  })
  
  const domain = Object.create(null, {
    apiHandlers: {
      get() { 
        return require('$resolve.apiHandlers').default
      }
    },
    aggregates: {
      get() { 
        return require('$resolve.aggregates').default
      }
    },
    readModels: {
      get() { 
        return require('$resolve.readModels').default
      }
    },
    viewModels: {
      get() { 
        return require('$resolve.viewModels').default
      }
    },
    sagas: {
      get() { 
        return require('$resolve.sagas').default
      }
    }
  })
  
  export default { 
    assemblies, 
    constants, 
    domain 
  } 
`
