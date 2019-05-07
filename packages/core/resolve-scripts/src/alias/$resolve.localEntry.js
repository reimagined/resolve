export default () => ({
  code: `
    import serverAssemblies from '$resolve.serverAssemblies'
    import eventBroker from '$resolve.eventBroker'
    import localEntry from 'resolve-runtime/lib/local'
    
    Object.assign(serverAssemblies.assemblies, { eventBroker })

    const initPromise = localEntry(serverAssemblies)

    const handler = async (...args) => {
      const worker = await initPromise
      return await worker(...args)
    }

    export default handler
  `
})
