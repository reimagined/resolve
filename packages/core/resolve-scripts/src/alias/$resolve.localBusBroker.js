import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.eventBroker`
    )
  }

  if (resolveConfig.target !== 'local') {
    throw new Error('Event broker can be launched only in "local" mode')
  }

  return {
    code: `
      require('$resolve.installLogger')
      const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

      const initBroker = (createLocalBusBroker) => {
        const createStorageAdapter = interopRequireDefault(
          require('$resolve.storageAdapter')
        ).default
        const eventBrokerConfig = interopRequireDefault(
          require('$resolve.eventBroker')
        ).default
        const createEventStore = interopRequireDefault(
          require('resolve-es')
        ).default

        const eventStore = createEventStore({ 
          storage: createStorageAdapter()
        })

        const localBusBroker = createLocalBusBroker({
          ...eventBrokerConfig,
          eventStore
        })

        localBusBroker.run()
      }

      let createLocalBusBroker = null
      try {
        createLocalBusBroker = interopRequireDefault(
          require('resolve-local-event-broker')
        ).default
      } catch(error) {
        console.log(\`                WARNING
          Module "resolve-local-event-broker" is not installed for current application.
          Local bus broker will not run, so read-models and sagas are suspended.
          To allow event transmission, run "yarn add resolve-local-event-broker" or
          "npm install resolve-local-event-broker" in your application folder.
        \`)
      }

      if (createLocalBusBroker != null) {
        initBroker(createLocalBusBroker)
      }
    `
  }
}
