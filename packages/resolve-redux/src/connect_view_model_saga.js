import { take, put, select, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import stringify from 'json-stable-stringify'

import { subscribeTopicRequest, loadViewModelStateRequest } from './actions'
import {
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  LOAD_VIEWMODEL_STATE_FAILURE,
  LOAD_VIEWMODEL_STATE_SUCCESS,
  DISPATCH_MQTT_EVENT
} from './action_types'

const eventListenerSaga = function*(
  connectAction,
  { sagaKey, sagaManager, eventTypes, aggregateIds }
) {
  let eventQueue = []

  while (true) {
    const { event } = yield take(
      action =>
        action.type === DISPATCH_MQTT_EVENT &&
        (eventTypes.indexOf(action.event.type) > -1 &&
          aggregateIds.indexOf(action.event.agggregateId))
    )

    eventQueue.push(event)

    //
    const { viewModels: viewModelsState } = yield select()

    const key = `aggregateVersionByAggregateId${sagaKey})}`

    const aggregateVersionByAggregateId = viewModelsState[key]

    if (!aggregateVersionByAggregateId) {
      continue
    }

    let lastAppliedAggregateVersion =
      aggregateVersionByAggregateId[event.aggregateId]

    eventQueue = eventQueue.filter(
      savedEvent =>
        !(
          savedEvent.aggregateVersion <= lastAppliedAggregateVersion &&
          savedEvent.aggregateId === event.aggregateId
        )
    )

    const nextEventsForAggregate = eventQueue
      .filter(savedEvent => savedEvent.aggregateId === event.aggregateId)
      .sort((a, b) => a.aggregateVersion - b.aggregateVersion)

    while (
      nextEventsForAggregate.length > 0 &&
      nextEventsForAggregate[0].aggregateVersion ===
        lastAppliedAggregateVersion + 1
    ) {
      yield put(nextEventsForAggregate[0])
      nextEventsForAggregate.splice(0, 1)
      lastAppliedAggregateVersion++
    }

    aggregateVersionByAggregateId[
      event.aggregateId
    ] = lastAppliedAggregateVersion

    if (nextEventsForAggregate.length > 10) {
      //TODO maybe fork fork die
      yield fork(function*() {
        yield delay(100)
        yield put(connectAction)
      })
      yield* sagaManager.stop(`${CONNECT_VIEWMODEL}${sagaKey}`)
    }
  }
}

const connectViewModelSaga = function*(action, sagaArgs) {
  const {
    appId,
    viewModels,
    connectionManager,
    sagaManager,
    sagaKey
  } = sagaArgs
  const { viewModelName, aggregateIds, aggregateArgs } = action
  const connectionId = stringify({ aggregateIds, aggregateArgs })

  const { addedConnections } = connectionManager.addConnection({
    connectionName: viewModelName,
    connectionId
  })

  if (addedConnections.length !== 1) {
    return
  }

  yield* sagaManager.stop(`${DISCONNECT_VIEWMODEL}${sagaKey}`)

  const eventTypes = Object.keys(viewModels[viewModelName].projection)

  // viewModelName + aggregateIds => Array<{ aggregateId, eventType }>
  let subscriptionKeys = eventTypes.map(eventType =>
    aggregateIds.map(aggregateId => ({ aggregateId, eventType }))
  )

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    action,
    sagaArgs
  )

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(subscribeTopicRequest(appId, aggregateId, eventType))
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

    if (loadViewModelStateResultAction.type === LOAD_VIEWMODEL_STATE_SUCCESS) {
      break
    }
  }
}

export default connectViewModelSaga
