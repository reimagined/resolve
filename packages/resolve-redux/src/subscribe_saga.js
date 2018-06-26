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

  const subscribeAdapterPromise = (async () => {
    const { appId, url } = await api.getSubscribeAdapterOptions()

    const onEvent = event => store.dispatch(dispatchMqttEvent(event))

    const subscribeAdapter = createSubscribeAdapter({
      ...subscribeAdapterOptions,
      appId,
      url,
      onEvent
    })

    await subscribeAdapter.init()

    return subscribeAdapter
  })()

  console.log('yield takeEvery(SUBSCRIBE_TOPIC_REQUEST, function*({')
  yield takeEvery(SUBSCRIBE_TOPIC_REQUEST, function*({ topicName, topicId }) {
    const subscribeAdapter = yield subscribeAdapterPromise
    console.log('SUBSCRIBE_TOPIC_REQUEST', topicName, topicId)

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
      yield put(subscribeTopicSuccess(topicName, topicId))
    } catch (error) {
      yield put(subscribeTopicFailure(topicName, topicId, error))
    }
  })

  yield takeEvery(UNSUBSCRIBE_TOPIC_REQUEST, function*({ topicName, topicId }) {
    const subscribeAdapter = yield subscribeAdapterPromise

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
      yield put(unsubscribeTopicSuccess(topicName, topicId))
    } catch (error) {
      yield put(unsubscribeTopicFailure(topicName, topicId, error))
    }
  })
}

export default subscribeSaga
