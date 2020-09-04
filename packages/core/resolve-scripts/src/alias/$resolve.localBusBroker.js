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
    import { createAndInitPublisher, connectConsumer } from 'resolve-local-event-broker'
    import eventBrokerConfig from '$resolve.eventBrokerConfig'

    if(module.parent != null) {
      setImmediate(() => process.exit(1))
      throw new Error('Event broker should be launched as independent process')
    }

    (async () => {
      try {
        const consumer = await connectConsumer({ ...eventBrokerConfig })
        const stopBroker = await createAndInitPublisher({
          ...eventBrokerConfig,
          connectConsumer
        })

        process.on('exit', stopBroker)
      } catch(error) {
        console.error('Event broker has run into an error:', error)

        process.exit(1)
      }
    })()
  `
}
