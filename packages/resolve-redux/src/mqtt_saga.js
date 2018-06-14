import mqtt from 'async-mqtt'
import { put, takeEvery } from 'redux-saga/effects'

import createConnectionManager from './create_connection_manager'

import {
  SUBSCRIBE_TOPIC_REQUEST,
  UNSUBSCRIBE_TOPIC_REQUEST
} from './action_types'
import {
  subscribeTopicSuccess,
  subscribeTopicFailure,
  unsubscribeTopicSuccess,
  unsubscribeTopicFailure,
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
      yield put(subscribeTopicSuccess(appId, topicName, topicId))
    } catch (error) {
      yield put(subscribeTopicFailure(appId, topicName, topicId, error))
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
      yield put(unsubscribeTopicSuccess(appId, topicName, topicId))
    } catch (error) {
      yield put(unsubscribeTopicFailure(appId, topicName, topicId, error))
    }
  })
}

export default mqttSaga
