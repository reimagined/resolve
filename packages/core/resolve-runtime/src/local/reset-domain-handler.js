import {
  ResourceAlreadyExistError as StorageResourceAlreadyExistError,
  ResourceNotExistError as StorageResourceNotExistError
} from 'resolve-storage-base'
import {
  ResourceAlreadyExistError as SnapshotResourceAlreadyExistError,
  ResourceNotExistError as SnapshotResourceNotExistError
} from 'resolve-snapshot-base'

const resetDomainHandler = options => async (req, res) => {
  const {
    readModelConnectors,
    snapshotAdapter,
    storageAdapter,
    eventBroker: { reset: resetListener },
    readModels,
    schedulers,
    sagas
  } = req.resolve

  try {
    const { dropEventStore, dropSnapshots, dropReadModels, dropSagas } = options

    if (dropEventStore) {
      try {
        await storageAdapter.drop()
      } catch (error) {
        if (!(error instanceof StorageResourceNotExistError)) {
          throw error
        }
      }

      try {
        await storageAdapter.init()
      } catch (error) {
        if (!(error instanceof StorageResourceAlreadyExistError)) {
          throw error
        }
      }
    }

    if (dropSnapshots) {
      try {
        await snapshotAdapter.drop()
      } catch (error) {
        if (!(error instanceof SnapshotResourceNotExistError)) {
          throw error
        }
      }

      try {
        await snapshotAdapter.init()
      } catch (error) {
        if (!(error instanceof SnapshotResourceAlreadyExistError)) {
          throw error
        }
      }
    }

    if (dropReadModels) {
      for (const { name, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]

        const connection = await connector.connect(name)
        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        // TODO: idempotent reset listener
        try {
          await resetListener(name)
        } catch (e) {}
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of [...sagas, ...schedulers]) {
        const connector = readModelConnectors[connectorName]

        const connection = await connector.connect(name)
        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        // TODO: idempotent reset listener
        try {
          await resetListener(name)
        } catch (e) {}
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
