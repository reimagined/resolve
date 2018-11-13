export default () => ({
  code: `
    import serverAssemblies from '$resolve.serverAssemblies'
    import { cloudEntry } from 'resolve-runtime'

    const initPromise = cloudEntry(serverAssemblies)

    const handler = async (...args) => {
      const worker = await initPromise
      return await worker(...args)
    }

    export default handler
  `
})
