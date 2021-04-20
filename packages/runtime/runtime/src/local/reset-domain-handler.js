import {
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError,
} from '@resolve-js/eventstore-base'

import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

const resetDomainHandler = (options) => async (req, res) => {
  const {
    eventstoreAdapter,
    eventSubscriber,
    domainInterop: { sagaDomain },
    domain: { readModels, sagas },
    applicationName,
  } = req.resolve

  try {
    const {
      dropEventStore,
      dropEventSubscriber,
      dropReadModels,
      dropSagas,
    } = options

    if (dropEventStore) {
      await invokeFilterErrorTypes(
        eventstoreAdapter.drop.bind(eventstoreAdapter),
        [EventstoreResourceNotExistError]
      )
      await invokeFilterErrorTypes(
        eventstoreAdapter.init.bind(eventstoreAdapter),
        [EventstoreResourceAlreadyExistError]
      )
    }

    const dropReadModelsSagasErrors = []
    if (dropReadModels) {
      for (const { name } of readModels) {
        try {
          await eventSubscriber.reset({ eventSubscriber: name })
        } catch (error) {
          dropReadModelsSagasErrors.push(error)
        }
      }
    }

    if (dropSagas) {
      for (const { name } of [
        ...sagaDomain.getSagasSchedulersInfo().map(({ name }) => ({
          name,
        })),
        ...sagas,
      ]) {
        try {
          await eventSubscriber.reset({ eventSubscriber: name })
        } catch (error) {
          dropReadModelsSagasErrors.push(error)
        }
      }
    }

    if (dropEventSubscriber) {
      const eventSubscribers = await eventstoreAdapter.getEventSubscribers({
        applicationName,
      })
      for (const { eventSubscriber } of eventSubscribers) {
        await eventstoreAdapter.removeEventSubscriber({
          applicationName,
          eventSubscriber,
        })
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

export default resetDomainHandler
