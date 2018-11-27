export default () => ({
  code: `
    import '$resolve.installLogger'
    import serverAssemblies from '$resolve.serverAssemblies'
    import cloudEntry from 'resolve-runtime/lib/cloud_entry'

    const initPromise = cloudEntry(serverAssemblies)

    const handler = async (...args) => {
      const worker = await initPromise
      return await worker(...args)
    }

    export default handler
  `
})
