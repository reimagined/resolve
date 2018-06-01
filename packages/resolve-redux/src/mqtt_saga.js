import mqtt from 'async-mqtt'
import { put, takeEvery } from 'redux-saga/effects'

import createConnectionManager from './connection_manager'

import {
  SUBSCRIBE_TOPIC_REQUEST,
  UNSUBSCRIBE_TOPIC_REQUEST
} from './action_types'
import {
  subscibeTopicSuccess,
  subscibeTopicFailure,
  unsubscibeTopicSuccess,
  unsubscibeTopicFailure,
  dispatchMqttEvent
} from './actions'

const mqttSaga = function*({ store, appId, mqttUrl, mqttQoS }) {
  const client = mqtt.connect(mqttUrl)

  const connectionManager = createConnectionManager()

  client.on('message', function(topic, message) {
    store.dispatch(dispatchMqttEvent(JSON.parse(message.toString())))
  })

  yield takeEvery(SUBSCRIBE_TOPIC_REQUEST, function*({
    appId,
    topicName,
    topicId
  }) {
    const {
      addedConnections,
      removedConnections
    } = connectionManager.addConnection({
      connectionName: topicName,
      connectionId: topicId
    })

    try {
      yield Promise.all([
        client.subscribe(
          addedConnections.map(
            ({ connectionName, connectionId }) =>
              `${appId}/${connectionName}/${connectionId}`
          ),
          {
            qos: mqttQoS
          }
        ),
        client.unsubscribe(
          removedConnections.map(
            ({ connectionName, connectionId }) =>
              `${appId}/${connectionName}/${connectionId}`
          ),
          {
            qos: mqttQoS
          }
        )
      ])
      yield put(subscibeTopicSuccess(appId, topicName, topicId))
    } catch (error) {
      yield put(subscibeTopicFailure(appId, topicName, topicId, error))
    }
  })

  yield takeEvery(UNSUBSCRIBE_TOPIC_REQUEST, function*({
    appId,
    topicName,
    topicId
  }) {
    const {
      addedConnections,
      removedConnections
    } = connectionManager.addConnection({
      connectionName: topicName,
      connectionId: topicId
    })

    try {
      yield Promise.all([
        client.subscribe(
          addedConnections.map(
            ({ connectionName, connectionId }) =>
              `${appId}/${connectionName}/${connectionId}`
          ),
          {
            qos: mqttQoS
          }
        ),
        client.unsubscribe(
          removedConnections.map(
            ({ connectionName, connectionId }) =>
              `${appId}/${connectionName}/${connectionId}`
          ),
          {
            qos: mqttQoS
          }
        )
      ])
      yield put(unsubscibeTopicSuccess(appId, topicName, topicId))
    } catch (error) {
      yield put(unsubscibeTopicFailure(appId, topicName, topicId, error))
    }
  })
}

export default mqttSaga
