import zmq from 'zeromq'

import wrapReadmodelConnector from '../wrap-readmodel-connector'

const resetDomainHandler = (
  {
    storageAdapterOptions,
    snapshotAdapterOptions,
    readModelConnectorsOptions,
    readModels,
    sagas,
    schedulers,
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

    const subSocket = zmq.socket('sub')
    await subSocket.connect(eventBroker.zmqBrokerAddress)

    const acknowledgeMessages = new Map()

    const takeAcknowledge = topic =>
      new Promise(resolve => acknowledgeMessages.set(topic, resolve))

    subSocket.setsockopt(zmq.ZMQ_SUBSCRIBE, new Buffer('ACKNOWLEDGE-TOPIC'))
    subSocket.on('message', message => {
      const payloadIndex = message.indexOf(' ') + 1
      const topicName = message.toString('utf8', 0, payloadIndex - 1)
      const content = message.toString('utf8', payloadIndex)

      if (topicName !== 'ACKNOWLEDGE-TOPIC') {
        return
      }

      const resolver = acknowledgeMessages.get(content)
      acknowledgeMessages.delete(content)
      if (typeof resolver === 'function') {
        resolver()
      }
    })

    const pubSocket = zmq.socket('pub')
    await pubSocket.connect(eventBroker.zmqConsumerAddress)

    if (dropReadModels) {
      for (const { name, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(name)

        await connector.drop(connection, name)
        await connector.disconnect(connection, name)

        await pubSocket.send(`DROP-MODEL-TOPIC ${name}`)
        await takeAcknowledge(`DROP-MODEL-TOPIC ${name}`)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of sagas) {
        const connector = readModelConnectors[connectorName]
        const sagaName = `_RESOLVE_SAGA_${name}`
        const connection = await connector.connect(sagaName)

        await connector.drop(connection, sagaName)
        await connector.disconnect(connection, sagaName)

        await pubSocket.send(`DROP-MODEL-TOPIC ${sagaName}`)
        await takeAcknowledge(`DROP-MODEL-TOPIC ${sagaName}`)
      }

      for (const { name, connectorName } of schedulers) {
        const connector = readModelConnectors[connectorName]
        const sagaName = `_RESOLVE_SCHEDULER_SAGA_${name}`
        const connection = await connector.connect(sagaName)

        await connector.drop(connection, sagaName)
        await connector.disconnect(connection, sagaName)

        await pubSocket.send(`DROP-MODEL-TOPIC ${sagaName}`)
        await takeAcknowledge(`DROP-MODEL-TOPIC ${sagaName}`)
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
