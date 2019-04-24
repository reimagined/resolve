import {
  RESOLVE_SAGA_PREFIX,
  RESOLVE_SCHEDULER_SAGA_PREFIX
} from '../sagas/constants'
import wrapReadmodelConnector from '../wrap-readmodel-connector'

const resetDomainHandler = (
  {
    storageAdapterOptions,
    snapshotAdapterOptions,
    readModelConnectorsOptions,
    readModels,
    sagas,
    schedulers
  },
  imports
) => async (req, res) => {
  try {
    const dropEventStore =
      req.query.hasOwnProperty('dropEventStore') &&
      req.query.dropEventStore !== 'false'
    const dropSnapshots =
      req.query.hasOwnProperty('dropSnapshots') &&
      req.query.dropSnapshots !== 'false'
    const dropReadModels =
      req.query.hasOwnProperty('dropReadModels') &&
      req.query.dropReadModels !== 'false'
    const dropSagas =
      req.query.hasOwnProperty('dropSagas') && req.query.dropSagas !== 'false'

    const storageAdapter = imports.storageAdapterModule(storageAdapterOptions)
    const snapshotAdapter = imports.snapshotAdapterModule(
      snapshotAdapterOptions
    )
    const readModelConnectors = {}
    for (const name of Object.keys(readModelConnectorsOptions)) {
      if (readModelConnectorsOptions[name] === null) {
        readModelConnectors[name] = imports[`readModelConnector_${name}`]
      } else {
        readModelConnectors[name] = imports[`readModelConnector_${name}`](
          readModelConnectorsOptions[name]
        )
      }

      readModelConnectors[name] = wrapReadmodelConnector(
        readModelConnectors[name],
        readModelConnectorsOptions[name]
      )
    }

    if (dropEventStore) {
      try {
        await storageAdapter.loadEvents(
          { startTime: -1, finishTime: -1 },
          async () => {}
        )
      } catch (err) {}
      await storageAdapter.dispose({ dropEvents: true })
    }

    if (dropSnapshots) {
      await snapshotAdapter.dispose({ dropSnapshots: true })
    }

    const { reset: resetListener } = req.resolve.eventBroker

    if (dropReadModels) {
      for (const { name: readModelName, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(readModelName)

        await connector.drop(connection, readModelName)
        await connector.disconnect(connection, readModelName)

        await resetListener(readModelName)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of sagas) {
        const connector = readModelConnectors[connectorName]
        const sagaName = `${RESOLVE_SAGA_PREFIX}${name}`
        const connection = await connector.connect(sagaName)

        await connector.drop(connection, sagaName)
        await connector.disconnect(connection, sagaName)

        await resetListener(sagaName)
      }

      for (const { name, connectorName } of schedulers) {
        const connector = readModelConnectors[connectorName]
        const sagaName = `${RESOLVE_SCHEDULER_SAGA_PREFIX}${name}`
        const connection = await connector.connect(sagaName)

        await connector.drop(connection, sagaName)
        await connector.disconnect(connection, sagaName)

        await resetListener(sagaName)
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
