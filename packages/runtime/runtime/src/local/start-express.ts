import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import bootstrap from '../common/bootstrap'
import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import type { Resolve } from '../common/types'

const host = '0.0.0.0'
const startExpress = async (resolve: Resolve) => {
  const { port, server, upstream } = resolve
  const currentResolve = Object.create(resolve)
  try {
    await initResolve(currentResolve)
    const { eventstoreAdapter } = currentResolve

    await invokeFilterErrorTypes(
      eventstoreAdapter.init.bind(eventstoreAdapter),
      [EventstoreResourceAlreadyExistError]
    )

    await bootstrap(currentResolve)

    const notReadyListeners = new Set([...resolve.eventListeners.keys()])

    while (upstream && notReadyListeners.size > 0) {
      for (const eventSubscriber of notReadyListeners) {
        const {
          successEvent,
          failedEvent,
          errors,
          status,
        } = await currentResolve.eventSubscriber.status({ eventSubscriber })

        if (
          successEvent != null ||
          failedEvent != null ||
          (Array.isArray(errors) && errors.length > 0) ||
          status !== 'deliver'
        ) {
          notReadyListeners.delete(eventSubscriber)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  } finally {
    await disposeResolve(currentResolve)
  }

  await new Promise<void>((resolve, reject) => {
    const errorHandler = (err: any) => reject(err)
    server.once('error', errorHandler)
    server.listen(port, host, () => {
      server.removeListener('error', errorHandler)

      // eslint-disable-next-line no-console
      console.log(`Application listening on port ${port}!`)
      resolve()
    })
  })
}

export default startExpress
