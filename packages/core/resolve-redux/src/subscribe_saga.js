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
  dispatchTopicMessage
} from './actions'

const subscribeSaga = function*({
  api,
  origin,
  rootPath,
  store,
  subscribeAdapter: createSubscribeAdapter
}) {
  const connectionManager = createConnectionManager()

  const subscribeAdapterPromise = (async () => {
    const { appId, url } = await api.getSubscribeAdapterOptions(
      createSubscribeAdapter.adapterName
    )

    const onEvent = event => store.dispatch(dispatchTopicMessage(event))

    const subscribeAdapter = createSubscribeAdapter({
      appId,
      origin,
      rootPath,
      url,
      onEvent
    })

    await subscribeAdapter.init()

    return subscribeAdapter
  })()

  yield takeEvery(SUBSCRIBE_TOPIC_REQUEST, function*({ topicName, topicId }) {
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
        addedConnections.length > 0
          ? subscribeAdapter.subscribeToTopics(
              addedConnections.map(({ connectionName, connectionId }) => ({
                topicName: connectionName,
                topicId: connectionId
              }))
            )
          : Promise.resolve(),
        removedConnections.length > 0
          ? subscribeAdapter.unsubscribeFromTopics(
              removedConnections.map(({ connectionName, connectionId }) => ({
                topicName: connectionName,
                topicId: connectionId
              }))
            )
          : Promise.resolve()
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
        addedConnections.length > 0
          ? subscribeAdapter.subscribeToTopics(
              addedConnections.map(({ connectionName, connectionId }) => ({
                topicName: connectionName,
                topicId: connectionId
              }))
            )
          : Promise.resolve(),
        removedConnections.length > 0
          ? subscribeAdapter.unsubscribeFromTopics(
              removedConnections.map(({ connectionName, connectionId }) => ({
                topicName: connectionName,
                topicId: connectionId
              }))
            )
          : Promise.resolve()
      ])
      yield put(unsubscribeTopicSuccess(topicName, topicId))
    } catch (error) {
      yield put(unsubscribeTopicFailure(topicName, topicId, error))
    }
  })
}

export default subscribeSaga
