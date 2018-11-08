export default () => ({
  code: `
    import serverAssemblies from '$resolve.serverAssemblies'
    import cloudServer from 'resolve-runtime/lib/cloud_entry'

    const initPromise = cloudServer(serverAssemblies)

    const handler = async (...args) => {
      const worker = await initPromise
      return await worker(...args)
    }

    export default handler
  `
})
