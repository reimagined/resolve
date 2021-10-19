import {
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError,
} from '@resolve-js/eventstore-base'
import { invokeFilterErrorTypes, getLog } from '@resolve-js/runtime-base'

import type { ResolveRequest, ResolveResponse } from '@resolve-js/runtime-base'

export const resetDomainHandler = (options: any) => async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
  const log = getLog('resetDomainHandler')
  const {
    runtime,
    eventstoreAdapter,
    domainInterop: { sagaDomain },
    domain: { readModels, sagas },
  } = req.resolve

  try {
    Object.keys(options).map((option) =>
      log.debug(`${option}: ${options[option]}`)
    )

    const {
      dropEventStore,
      dropEventSubscriber,
      dropReadModels,
      dropSagas,
      bootstrap,
    } = options

    if (dropEventStore) {
      log.debug(`dropping event store`)
      await invokeFilterErrorTypes(
        eventstoreAdapter.drop.bind(eventstoreAdapter),
        [EventstoreResourceNotExistError]
      )
      log.debug(`re-initializing event store`)
      await invokeFilterErrorTypes(
        eventstoreAdapter.init.bind(eventstoreAdapter),
        [EventstoreResourceAlreadyExistError]
      )
    }

    const dropReadModelsSagasErrors = []
    if (dropReadModels) {
      log.debug(`dropping ${readModels.length} read models`)
      for (const { name } of readModels) {
        try {
          await runtime.eventSubscriber.reset({ eventSubscriber: name })
        } catch (error) {
          dropReadModelsSagasErrors.push(error)
        }
      }
    }

    if (dropSagas) {
      const sagasToDrop = [
        ...sagaDomain.getSagasSchedulersInfo().map(({ name }) => ({
          name,
        })),
        ...sagas,
      ]
      log.debug(`dropping ${sagasToDrop.length} sagas`)
      for (const { name } of sagasToDrop) {
        try {
          await runtime.eventSubscriber.reset({ eventSubscriber: name })
        } catch (error) {
          dropReadModelsSagasErrors.push(error)
        }
      }
    }

    if (dropEventSubscriber) {
      log.debug(`shutting down all event listeners`)
      await runtime.eventListenersManager.shutdownAll(true)
      if (bootstrap) {
        log.debug(`bootstrapping all event listeners`)
        await runtime.eventListenersManager.bootstrapAll(true)
      }
    }

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}
