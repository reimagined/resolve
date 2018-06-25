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

const subscribeSaga = function*({
  api,
  store,
  subscribeAdapter: {
    module: createSubscribeAdapter,
    options: subscribeAdapterOptions
  }
}) {
  const connectionManager = createConnectionManager()

  const { appId, url } = yield api.getSubscribeAdapterOptions()

  const onEvent = event => store.dispatch(dispatchMqttEvent(event))

  const subscribeAdapter = createSubscribeAdapter({
    ...subscribeAdapterOptions,
    appId,
    url,
    onEvent
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
        subscribeAdapter.subscribeToTopics(
          addedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        ),
        subscribeAdapter.unsubscribeFromTopics(
          removedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
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
        subscribeAdapter.subscribeToTopics(
          addedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        ),
        subscribeAdapter.unsubscribeFromTopics(
          removedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        )
      ])
      yield put(unsubscribeTopicSuccess(appId, topicName, topicId))
    } catch (error) {
      yield put(unsubscribeTopicFailure(appId, topicName, topicId, error))
    }
  })
}

export default subscribeSaga
