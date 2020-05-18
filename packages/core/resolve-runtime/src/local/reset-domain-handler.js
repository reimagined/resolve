import {
  EventstoreResourceAlreadyExistError,
  EventstoreResourceNotExistError
} from 'resolve-eventstore-base'
import {
  SnapshotResourceAlreadyExistError,
  SnapshotResourceNotExistError
} from 'resolve-snapshot-base'
import {
  PublisherResourceAlreadyExistError,
  PublisherResourceNotExistError
} from 'resolve-local-event-broker'

import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

const resetDomainHandler = options => async (req, res) => {
  const {
    snapshotAdapter,
    eventstoreAdapter,
    publisher,
    readModels,
    schedulers,
    sagas
  } = req.resolve

  try {
    const {
      dropEventStore,
      dropSnapshots,
      dropEventBus,
      dropReadModels,
      dropSagas
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

    if (dropSnapshots) {
      await invokeFilterErrorTypes(snapshotAdapter.drop.bind(snapshotAdapter), [
        SnapshotResourceNotExistError
      ])
      await invokeFilterErrorTypes(snapshotAdapter.init.bind(snapshotAdapter), [
        SnapshotResourceAlreadyExistError
      ])
    }

    if (dropEventBus) {
      await invokeFilterErrorTypes(publisher.drop.bind(publisher), [
        PublisherResourceNotExistError
      ])
      await invokeFilterErrorTypes(publisher.init.bind(publisher), [
        PublisherResourceAlreadyExistError
      ])
    }

    if (dropReadModels) {
      for (const { name } of readModels) {
        await publisher.reset(name)
      }
    }

    if (dropSagas) {
      for (const { name } of [...sagas, ...schedulers]) {
        await publisher.reset(name)
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
