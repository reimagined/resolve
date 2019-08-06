import { put, takeEvery, fork, delay } from 'redux-saga/effects'

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

const SUBSCRIBE_ADAPTER_POLL_INTERVAL = 5000

const initSubscribeAdapter = async ({
  api,
  origin,
  rootPath,
  store,
  subscribeAdapter: createSubscribeAdapter
}) => {
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
}

const subscribeSaga = function*(subscribeSagaOptions) {
  const connectionManager = createConnectionManager()
  let subscribeAdapterPromise = initSubscribeAdapter(subscribeSagaOptions)

  yield fork(function*() {
    while (true) {
      yield delay(SUBSCRIBE_ADAPTER_POLL_INTERVAL)
      let subscribeAdapter = null

      try {
        subscribeAdapter = yield subscribeAdapterPromise
        if (subscribeAdapter.isConnected()) {
          continue
        }
      } catch (error) {}

      const activeConnections = connectionManager.getConnections()
      let refreshSubscribeAdapter = null

      subscribeAdapterPromise = new Promise(
        (resolve, reject) =>
          (refreshSubscribeAdapter = value =>
            value != null && value instanceof Error
              ? reject(value)
              : resolve(value))
      )
      subscribeAdapterPromise.catch(() => {})

      try {
        if (subscribeAdapter != null) {
          yield subscribeAdapter.close()
        }

        subscribeAdapter = yield initSubscribeAdapter(subscribeSagaOptions)

        yield subscribeAdapter.subscribeToTopics(
          activeConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        )

        refreshSubscribeAdapter(subscribeAdapter)
      } catch (error) {
        refreshSubscribeAdapter(error)
      }
    }
  })

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
    } = connectionManager.removeConnection({
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
