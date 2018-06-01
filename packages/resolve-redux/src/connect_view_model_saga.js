import { take, put, cancel } from 'redux-saga/effects'
import stringify from 'json-stable-stringify'

import { subscibeTopicRequest, loadViewModelStateRequest } from './actions'
import {
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  LOAD_VIEWMODEL_STATE_FAILURE,
  LOAD_VIEWMODEL_STATE_SUCCESS,
  DISPATCH_MQTT_EVENT
} from './action_types'

const connectViewModelSaga = function*(
  {
    appId,
    viewModels,
    connectionSagas,
    disconnectionSagas,
    connectionManager,
    sagaId
  },
  { viewModelName, aggregateIds, aggregateArgs }
) {
  const connectionId = stringify({ aggregateIds, aggregateArgs })

  const { addedConnections } = connectionManager.addConnection({
    connectionName: viewModelName,
    connectionId
  })

  if (addedConnections.length !== 1) {
    return
  }

  const sagaKey = stringify({ viewModelName, aggregateIds, aggregateArgs })
  connectionSagas[sagaKey] = sagaId

  if (disconnectionSagas[sagaKey]) {
    yield cancel(disconnectionSagas[sagaKey])
    delete disconnectionSagas[sagaKey]
  }

  const eventTypes = Object.keys(viewModels[viewModelName].projection)

  let subscriptionKeys = eventTypes.map(eventType =>
    aggregateIds.map(aggregateId => ({ aggregateId, eventType }))
  )

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(subscibeTopicRequest(appId, aggregateId, eventType))
    }

    while (counter > 0) {
      const subscribeResultAction = yield take(
        action =>
          (action.type === SUBSCRIBE_TOPIC_SUCCESS ||
            action.type === SUBSCRIBE_TOPIC_FAILURE) &&
          (action.appId === appId &&
            subscriptionKeys.find(
              key =>
                key.aggregateId === action.aggregateId &&
                key.eventType === action.eventType
            ))
      )

      if (subscribeResultAction.type === SUBSCRIBE_TOPIC_SUCCESS) {
        subscriptionKeys = subscriptionKeys.filter(
          key =>
            !(
              key.aggregateId === subscribeResultAction.aggregateId &&
              key.eventType === subscribeResultAction.eventType
            )
        )
      }

      counter--
    }
  }

  while (true) {
    yield put(
      loadViewModelStateRequest(viewModelName, aggregateIds, aggregateArgs)
    )

    const loadViewModelStateResultAction = yield take(
      action =>
        (action.type === LOAD_VIEWMODEL_STATE_SUCCESS ||
          action.type === LOAD_VIEWMODEL_STATE_FAILURE) &&
        (action.viewModelName === viewModelName &&
          stringify({
            aggregateIds: action.aggregateIds,
            aggregateArgs: action.aggregateArgs
          }) === connectionId)
    )

    if (loadViewModelStateResultAction.type === SUBSCRIBE_TOPIC_SUCCESS) {
      break
    }
  }

  // const aggregateVersionByAggregateId = {}
  //
  const { viewModels: viewModelsState } = yield select()

  // TODO
  const key = `aggregateVersionByAggregateId${stringify({
    viewModelName,
    aggregateIds,
    aggregateArgs
  })}`

  // TODO check undefined
  const aggregateVersionByAggregateId = viewModelsState[key]

  while (true) {
    const { event } = yield take(
      action =>
        action.type === DISPATCH_MQTT_EVENT &&
        (eventTypes.indexOf(action.event.type) > -1 &&
          aggregateIds.indexOf(action.event.agggregateId))
    )

    const prevAggregateVersion =
      aggregateVersionByAggregateId[event.aggregateId]
    const nextAggregateVersion = event.aggregateVersion

    if (nextAggregateVersion === prevAggregateVersion + 1) {
      aggregateVersionByAggregateId[event.aggregateId]++
      yield put(event)
    }
  }
}

export default connectViewModelSaga
