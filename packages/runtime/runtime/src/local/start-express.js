import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import bootstrap from '../common/bootstrap'
import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'
import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { PublisherResourceAlreadyExistError } from '@resolve-js/local-event-broker'

const host = '0.0.0.0'
const startExpress = async (resolve) => {
  const {
    port,
    server,
    assemblies: {
      eventBrokerConfig: { upstream },
    },
  } = resolve

  const currentResolve = Object.create(resolve)
  try {
    await initResolve(currentResolve)
    const { eventstoreAdapter, publisher } = currentResolve

    await invokeFilterErrorTypes(
      eventstoreAdapter.init.bind(eventstoreAdapter),
      [EventstoreResourceAlreadyExistError]
    )
    await invokeFilterErrorTypes(publisher.init.bind(publisher), [
      PublisherResourceAlreadyExistError,
    ])

    await bootstrap(currentResolve, upstream)

    const notReadyListeners = new Set([...resolve.eventListeners.keys()])

    while (upstream && notReadyListeners.size > 0) {
      for (const eventSubscriber of notReadyListeners) {
        const {
          successEvent,
          failedEvent,
          errors,
        } = await currentResolve.eventBus.status({ eventSubscriber })
        if (
          successEvent != null ||
          failedEvent != null ||
          (Array.isArray(errors) && errors.length > 0)
        ) {
          notReadyListeners.delete(eventSubscriber)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  } finally {
    await disposeResolve(currentResolve)
  }

  await new Promise((resolve, reject) =>
    server.listen(port, host, async (error) => {
      if (error) {
        return reject(error)
      }

      // eslint-disable-next-line no-console
      console.log(`Application listening on port ${port}!`)
      return resolve()
    })
  )

  server.on('error', (err) => {
    throw err
  })
}

export default startExpress
