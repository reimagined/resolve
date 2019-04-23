import zmq from 'zeromq'

import {
  RESOLVE_SAGA_PREFIX,
  RESOLVE_SCHEDULER_SAGA_PREFIX
} from '../sagas/constants'
import wrapReadmodelConnector from '../wrap-readmodel-connector'

const RESOLVE_ACKNOWLEDGE_TOPIC = '__RESOLVE_ACKNOWLEDGE_TOPIC__'

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
    const instanceId = `${process.pid}${Math.floor(Math.random() * 100000)}`

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

    const acknowledgeTopic = `${new Buffer(RESOLVE_ACKNOWLEDGE_TOPIC).toString(
      'base64'
    )}-${new Buffer(instanceId).toString('base64')}`

    subSocket.setsockopt(zmq.ZMQ_SUBSCRIBE, new Buffer(acknowledgeTopic))
    subSocket.on('message', byteMessage => {
      const message = byteMessage.toString('utf8')
      const payloadIndex = message.indexOf(' ') + 1
      const topicName = message.substring(0, payloadIndex - 1)
      const content = message.substring(payloadIndex)

      const [listenerId, clientId] = topicName
        .split('-')
        .map(str => new Buffer(str, 'base64').toString('utf8'))

      if (listenerId !== RESOLVE_ACKNOWLEDGE_TOPIC || clientId !== instanceId) {
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
      for (const { name: readModelName, connectorName } of readModels) {
        const connector = readModelConnectors[connectorName]
        const connection = await connector.connect(readModelName)

        await connector.drop(connection, readModelName)
        await connector.disconnect(connection, readModelName)

        const topicName = `${new Buffer(RESOLVE_ACKNOWLEDGE_TOPIC).toString(
          'base64'
        )}-${new Buffer(instanceId).toString('base64')}`

        await pubSocket.send(`DROP-MODEL-TOPIC ${topicName} ${readModelName}`)
        await takeAcknowledge(readModelName)
      }
    }

    if (dropSagas) {
      for (const { name, connectorName } of sagas) {
        const connector = readModelConnectors[connectorName]
        const sagaName = `${RESOLVE_SAGA_PREFIX}${name}`
        const connection = await connector.connect(sagaName)

        await connector.drop(connection, sagaName)
        await connector.disconnect(connection, sagaName)

        const topicName = `${new Buffer(RESOLVE_ACKNOWLEDGE_TOPIC).toString(
          'base64'
        )}-${new Buffer(instanceId).toString('base64')}`

        await pubSocket.send(`DROP-MODEL-TOPIC ${topicName} ${sagaName}`)
        await takeAcknowledge(sagaName)
      }

      for (const { name, connectorName } of schedulers) {
        const connector = readModelConnectors[connectorName]
        const sagaName = `${RESOLVE_SCHEDULER_SAGA_PREFIX}${name}`
        const connection = await connector.connect(sagaName)

        await connector.drop(connection, sagaName)
        await connector.disconnect(connection, sagaName)

        const topicName = `${new Buffer(RESOLVE_ACKNOWLEDGE_TOPIC).toString(
          'base64'
        )}-${new Buffer(instanceId).toString('base64')}`

        await pubSocket.send(`DROP-MODEL-TOPIC ${topicName} ${sagaName}`)
        await takeAcknowledge(sagaName)
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
