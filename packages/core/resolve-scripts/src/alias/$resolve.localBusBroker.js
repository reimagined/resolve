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

  return {
    code: `
      import createStorageAdapter from '$resolve.storageAdapter'
      import eventBrokerConfig from '$resolve.eventBroker'
      import { createAndRunLocalBusBroker } from 'resolve-local-event-broker'
      import createEventStore from 'resolve-es'

      if(module.parent != null) {
        setImmediate(() => process.exit(1))
        throw new Error('Event broker should be launched as independent process')
      }

      (async () => {
        try {
          const stopBroker = await createAndRunLocalBusBroker({
            ...eventBrokerConfig,
            eventStore: createEventStore({ 
              storage: createStorageAdapter()
            })
          })

          process.on('exit', stopBroker)
        } catch(error) {
          console.error('Event broker has run into an error:', error)

          process.exit(1)
        }
      })()
    `
  }
}
