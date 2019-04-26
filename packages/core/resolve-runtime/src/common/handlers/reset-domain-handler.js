import {
  RESOLVE_SAGA_PREFIX,
  RESOLVE_SCHEDULER_SAGA_PREFIX
} from '../sagas/constants'

const isSagaName = name =>
  name.indexOf(RESOLVE_SAGA_PREFIX) === 0 ||
  name.indexOf(RESOLVE_SCHEDULER_SAGA_PREFIX) === 0

const resetDomainHandler = () => async (req, res) => {
  const {
    readModelConnectors,
    snapshotAdapter,
    storageAdapter,
    eventBroker: { reset: resetListener },
    readModels,
    viewModels,
    aggregates
  } = req.resolve

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

    if (dropEventStore) {
      await storageAdapter.drop()
    }

    if (dropSnapshots) {
      for (const { invariantHash } of [...viewModels, ...aggregates]) {
        if (invariantHash != null) {
          await snapshotAdapter.drop(invariantHash)
        }
      }
    }

    if (dropReadModels) {
      for (const { name, connectorName } of readModels) {
        if (isSagaName(name)) continue
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await resetListener(name)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of readModels) {
        if (!isSagaName(name)) continue
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await resetListener(name)
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
