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
      } catch (e) {}

      try {
        await storageAdapter.init()
      } catch (e) {}
    }

    if (dropSnapshots) {
      try {
        await snapshotAdapter.drop()
      } catch (e) {}

      try {
        await snapshotAdapter.init()
      } catch (e) {}
    }

    if (dropReadModels) {
      for (const { name, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]

        try {
          const connection = await connector.connect(name)
          await connector.drop(connection, name)
          await connector.disconnect(connection, name)
        } catch (e) {}

        try {
          await resetListener(name)
        } catch (e) {}
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of [...sagas, ...schedulers]) {
        const connector = readModelConnectors[connectorName]

        try {
          const connection = await connector.connect(name)
          await connector.drop(connection, name)
          await connector.disconnect(connection, name)
        } catch (e) {}

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
