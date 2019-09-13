import isSagaName from '../common/utils/is-saga-name'

const resetDomainHandler = options => async (req, res) => {
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
    const { dropEventStore, dropSnapshots, dropReadModels, dropSagas } = options

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
        if (isSagaName(req.resolve, name)) continue
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await resetListener(name)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of readModels) {
        if (!isSagaName(req.resolve, name)) continue
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
