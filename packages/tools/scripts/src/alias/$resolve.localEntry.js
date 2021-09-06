const importLocalEntry = () => `
  import '$resolve.guardOnlyServer'
  import serverAssemblies from '$resolve.serverAssemblies'
  import localEntry from '@resolve-js/runtime/lib/local'

  export { default as entryPointMarker } from '@resolve-js/runtime/lib/common/dynamic-require/entry-point-marker'

  const initPromise = localEntry(serverAssemblies)

  const handler = async (...args) => {
    const worker = await initPromise
    return await worker(...args)
  }

  export default handler
`
export default importLocalEntry
