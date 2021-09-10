const importLocalEntry = () => `
  import '$resolve.guardOnlyServer'
  import serverAssemblies from '$resolve.serverAssemblies'
  import { localEntry } from '@resolve-js/runtime'

  export { entryPointMarker } from '@resolve-js/runtime'

  const initPromise = localEntry(serverAssemblies)

  const handler = async (...args) => {
    const worker = await initPromise
    return await worker(...args)
  }

  export default handler
`
export default importLocalEntry
