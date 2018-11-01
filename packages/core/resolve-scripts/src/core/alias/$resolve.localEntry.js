export default () => ({
  code: `
    import serverAssemblies from '$resolve.serverAssemblies'
    import localServer from 'resolve-scripts/lib/runtime/local_entry'

    const initPromise = localServer(serverAssemblies)

    const handler = async (...args) => {
      const worker = await initPromise
      return await worker(...args)
    }

    export default handler
  `
})
