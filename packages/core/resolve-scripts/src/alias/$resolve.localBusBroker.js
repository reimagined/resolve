import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.eventBroker`
    )
  }

  if (resolveConfig.target !== 'local') {
    throw new Error('Event broker can be build only in "local" mode')
  }

  return `
    import '$resolve.guardOnlyServer'
<<<<<<< HEAD
    import { createAndInitPublisher, connectConsumer } from 'resolve-local-event-broker'
    import eventBrokerConfig from '$resolve.eventBrokerConfig'
=======
    import createEventstoreAdapter from '$resolve.eventstoreAdapter'
    import eventBrokerConfig from '$resolve.eventBroker'
    import { createAndRunLocalBusBroker } from 'resolve-local-event-broker'
    import createEventStore from 'resolve-es'
>>>>>>> feature/dev

    if(module.parent != null) {
      setImmediate(() => process.exit(1))
      throw new Error('Event broker should be launched as independent process')
    }

    (async () => {
      try {
        const consumer = await connectConsumer({ ...eventBrokerConfig })
        const stopBroker = await createAndInitPublisher({
          ...eventBrokerConfig,
<<<<<<< HEAD
          connectConsumer
=======
          eventStore: createEventStore({ 
            eventstore: createEventstoreAdapter()
          })
>>>>>>> feature/dev
        })

        process.on('exit', stopBroker)
      } catch(error) {
        console.error('Event broker has run into an error:', error)

        process.exit(1)
      }
    })()
  `
}
