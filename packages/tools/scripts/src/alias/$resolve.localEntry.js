const importLocalEntry = () => `
  import '$resolve.guardOnlyServer'
  import serverAssemblies from '$resolve.serverAssemblies'
  import { entry } from '@resolve-js/runtime-dev'

  export { entryPointMarker } from '@resolve-js/runtime-base'

  const initPromise = entry(serverAssemblies)

  const handler = async (...args) => {
    const worker = await initPromise
    return await worker(...args)
  }

  export default handler
`
export default importLocalEntry
