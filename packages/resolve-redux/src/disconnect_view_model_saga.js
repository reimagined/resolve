import { take, put, cancel } from 'redux-saga/effects'
import stringify from 'json-stable-stringify'

import { unsubscibeTopicRequest, dropViewModelState } from './actions'
import {
  UNSUBSCRIBE_TOPIC_SUCCESS,
  UNSUBSCRIBE_TOPIC_FAILURE,
  CONNECT_VIEWMODEL
} from './action_types'

const disconnectViewModelSaga = function*(sagaArgs, action) {
  const { viewModels, connectionManager, sagaManager, sagaKey } = sagaArgs

  const { viewModelName, aggregateIds, aggregateArgs } = action

  const connectionId = `${stringify(aggregateIds)}${stringify(aggregateArgs)}`

  const { removedConnections } = connectionManager.removeConnection({
    connectionName: viewModelName,
    connectionId
  })
  if (removedConnections.length !== 1) {
    return
  }

  yield* sagaManager.stop(`${CONNECT_VIEWMODEL}${sagaKey}`)

  let subscriptionKeys = Object.keys(viewModels[viewModelName].projection).map(
    eventType => aggregateIds.map(aggregateId => ({ aggregateId, eventType }))
  )

  yield put(dropViewModelState(viewModelName, aggregateIds, aggregateArgs))

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(unsubscibeTopicRequest(aggregateId, eventType))
    }

    while (counter > 0) {
      const unsubscribeResultAction = yield take(
        action =>
          (action.type === UNSUBSCRIBE_TOPIC_SUCCESS ||
            action.type === UNSUBSCRIBE_TOPIC_FAILURE) &&
          subscriptionKeys.find(
            key =>
              key.aggregateId === action.aggregateId &&
              key.eventType === action.eventType
          )
      )

      if (unsubscribeResultAction.type === UNSUBSCRIBE_TOPIC_SUCCESS) {
        subscriptionKeys = subscriptionKeys.filter(
          key =>
            !(
              key.aggregateId === unsubscribeResultAction.aggregateId &&
              key.eventType === unsubscribeResultAction.eventType
            )
        )
      }

      counter--
    }
  }
}

export default disconnectViewModelSaga
