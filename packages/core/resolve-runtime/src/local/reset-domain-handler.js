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
      await storageAdapter.drop()
      await storageAdapter.init()
    }

    if (dropSnapshots) {
      await snapshotAdapter.drop()
      await snapshotAdapter.init()
    }

    if (dropReadModels) {
      for (const { name, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await resetListener(name)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of [...sagas, ...schedulers]) {
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
