import { take, put, select, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import stringify from 'json-stable-stringify'

import { aggregateVersionsMap } from './constants'

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
  { sagaKey, sagaManager, eventTypes }
) {
  let eventQueue = []

  while (true) {
    const { event } = yield take(
      action =>
        action.type === DISPATCH_MQTT_EVENT &&
        (eventTypes.indexOf(action.event.type) > -1 &&
          connectAction.aggregateIds.indexOf(action.event.agggregateId))
    )

    eventQueue.push(event)

    //
    const {
      viewModels: { [aggregateVersionsMap]: viewModelsAggregateVersionsMap }
    } = yield select()

    const key = `${connectAction.viewModelName}${stringify(
      connectAction.aggregateIds
    )}${stringify(connectAction.aggregateArgs)}`

    const aggregateVersionByAggregateId = viewModelsAggregateVersionsMap[key]

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

const connectViewModelSaga = function*(sagaArgs, action) {
  const { viewModels, connectionManager, sagaManager, sagaKey } = sagaArgs
  const { viewModelName, aggregateIds, aggregateArgs } = action

  const connectionId = `${stringify(action.aggregateIds)}${stringify(
    action.aggregateArgs
  )}`

  const { addedConnections } = connectionManager.addConnection({
    connectionName: viewModelName,
    connectionId
  })

  if (addedConnections.length !== 1) {
    return
  }

  yield* sagaManager.stop(`${DISCONNECT_VIEWMODEL}${sagaKey}`)

  const viewModel = viewModels.find(({ name }) => name === viewModelName)

  const eventTypes = Object.keys(viewModel.projection)

  // viewModelName + aggregateIds => Array<{ aggregateId, eventType }>
  let subscriptionKeys = eventTypes.reduce((acc, eventType) => {
    acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
    return acc
  }, [])

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    action,
    {
      ...sagaArgs,
      eventTypes
    }
  )

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(subscribeTopicRequest(aggregateId, eventType))
    }

    while (counter > 0) {
      const subscribeResultAction = yield take(action => {
        return (
          (action.type === SUBSCRIBE_TOPIC_SUCCESS ||
            action.type === SUBSCRIBE_TOPIC_FAILURE) &&
          subscriptionKeys.find(
            key =>
              key.aggregateId === action.topicName &&
              key.eventType === action.topicId
          )
        )
      })

      if (subscribeResultAction.type === SUBSCRIBE_TOPIC_SUCCESS) {
        subscriptionKeys = subscriptionKeys.filter(
          key =>
            !(
              key.aggregateId === subscribeResultAction.topicName &&
              key.eventType === subscribeResultAction.topicId
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
          `${action.aggregateIds}${action.aggregateArgs}` === connectionId)
    )

    if (loadViewModelStateResultAction.type === LOAD_VIEWMODEL_STATE_SUCCESS) {
      break
    }
  }
}

export default connectViewModelSaga
