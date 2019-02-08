export default () => ({
  code: `
      import assemblies from '$resolve.assemblies'
      import constants from '$resolve.constants'
      import apiHandlers from '$resolve.apiHandlers'
      import aggregates from '$resolve.aggregates'
      import customReadModels from '$resolve.customReadModels'
      import readModels from '$resolve.readModels'
      import viewModels from '$resolve.viewModels'
      import sagas from '$resolve.sagas'
  
      const { routes, redux, ...restAssemblies } = assemblies

      const serverAssemblies = {
        assemblies: restAssemblies,
        constants,
        domain: {
          apiHandlers,
          aggregates,
          customReadModels,
          readModels,
          viewModels,
          sagas
        },
        routes,
        redux
      }
  
      export default serverAssemblies
    `
})
