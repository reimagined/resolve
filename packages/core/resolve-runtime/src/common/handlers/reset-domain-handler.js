import zmq from 'zeromq'

const resetDomainHandler = (
  {
    storageAdapterOptions,
    snapshotAdapterOptions,
    readModelConnectorsOptions,
    readModels,
    sagas,
    eventBroker
  },
  imports
) => async (req, res) => {
  try {
    const dropEventStore =
      req.query.hasOwnProperty('dropEventStore') &&
      req.query.dropEventStore !== 'false'
    const dropSnapshots =
      req.query.hasOwnProperty('dropSnapshots') &&
      req.query.dropEventStore !== 'false'
    const dropReadModels =
      req.query.hasOwnProperty('dropReadModels') &&
      req.query.dropEventStore !== 'false'
    const dropSagas =
      req.query.hasOwnProperty('dropSagas') &&
      req.query.dropEventStore !== 'false'

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

      readModelConnectors[name] = Object.create(readModelConnectors[name])
      const connector = readModelConnectors[name]

      if (typeof connector.connect !== 'function') {
        Object.defineProperty(connector, 'connect', {
          value: async () => {
            return readModelConnectorsOptions[name]
          }
        })
      }
      if (typeof connector.disconnect !== 'function') {
        Object.defineProperty(connector, 'disconnect', {
          value: async () => {}
        })
      }
      if (typeof connector.drop !== 'function') {
        Object.defineProperty(connector, 'drop', { value: async () => {} })
      }
      if (typeof connector.dispose !== 'function') {
        Object.defineProperty(connector, 'dispose', { value: async () => {} })
      }
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

    const pubSocket = zmq.socket('pub')
    await pubSocket.connect(eventBroker.zmqConsumerAddress)

    if (dropReadModels) {
      for (const { name, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]

        console.log({ connector, name, connectorName })

        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await pubSocket.send(`DROP-MODEL-TOPIC ${name}`)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of sagas) {
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await pubSocket.send(`DROP-MODEL-TOPIC ${name}`)
      }
    }

    await pubSocket.disconnect(eventBroker.zmqConsumerAddress)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default resetDomainHandler
