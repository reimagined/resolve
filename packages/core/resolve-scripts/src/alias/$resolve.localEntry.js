export default () => `
  import '$resolve.guardOnlyServer'
  import { connectLocalBusBroker } from 'resolve-local-event-broker'
  import serverAssemblies from '$resolve.serverAssemblies'
  import eventBroker from '$resolve.eventBroker'
  import localEntry from 'resolve-runtime/lib/local'

  export { default as entryPointMarker } from 'resolve-runtime/lib/common/utils/entry-point-marker'
  
  Object.assign(serverAssemblies.assemblies, {
    eventBroker,
    connectLocalBusBroker
  })

  const initPromise = localEntry(serverAssemblies)

  const handler = async (...args) => {
    const worker = await initPromise
    return await worker(...args)
  }

  export default handler
`
