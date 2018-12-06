export default () => ({
  code: `
    import '$resolve.installLogger'
    import serverAssemblies from '$resolve.serverAssemblies'
    import localEntry from 'resolve-runtime/lib/local_entry'

    const initPromise = localEntry(serverAssemblies)

    const handler = async (...args) => {
      const worker = await initPromise
      return await worker(...args)
    }

    export default handler
  `
})
