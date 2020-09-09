import {
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError,
} from 'resolve-eventstore-base'
import {
  PublisherResourceAlreadyExistError,
  PublisherResourceNotExistError,
} from 'resolve-local-event-broker'

import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

const resetDomainHandler = (options) => async (req, res) => {
  const {
    eventstoreAdapter,
    eventBus,
    publisher,
    readModels,
    schedulers,
    sagas,
  } = req.resolve

  try {
    const { dropEventStore, dropEventBus, dropReadModels, dropSagas } = options

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
          await eventBus.reset({ eventSubscriber: name })
        } catch (error) {
          dropReadModelsSagasErrors.push(error)
        }
      }
    }

    if (dropSagas) {
      for (const { name } of [...sagas, ...schedulers]) {
        try {
          await eventBus.reset({ eventSubscriber: name })
        } catch (error) {
          dropReadModelsSagasErrors.push(error)
        }
      }
    }

    if (dropEventBus) {
      // eslint-disable-next-line no-console
      console.warn(
        dropReadModelsSagasErrors.map((error) => error.message).join('\n')
      )
      await invokeFilterErrorTypes(publisher.drop.bind(publisher), [
        PublisherResourceNotExistError,
      ])
      await invokeFilterErrorTypes(publisher.init.bind(publisher), [
        PublisherResourceAlreadyExistError,
      ])
    } else {
      if (dropReadModelsSagasErrors.length) {
        const compositeError = new Error(
          dropReadModelsSagasErrors.map((error) => error.message).join('\n')
        )
        compositeError.stack = dropReadModelsSagasErrors
          .map((error) => error.stack)
          .join('\n')
        throw compositeError
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
