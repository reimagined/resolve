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
  { sagaKey, sagaManager, eventTypes },
  connectAction
) {
  let eventQueue = []

  while (true) {
    const { event } = yield take(
      action =>
        action.type === DISPATCH_MQTT_EVENT &&
        (eventTypes.indexOf(action.event.type) > -1 &&
          (connectAction.aggregateIds === '*' ||
            connectAction.aggregateIds.indexOf(action.event.agggregateId)))
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

    if (
      connectAction.aggregateIds === '*' &&
      !aggregateVersionByAggregateId.hasOwnProperty(event.aggregateId)
    ) {
      aggregateVersionByAggregateId[event.aggregateId] =
        event.aggregateVersion - 1
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
    if (Array.isArray(aggregateIds)) {
      acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
    } else if (aggregateIds === '*') {
      acc.push({ aggregateId: '*', eventType })
    }
    return acc
  }, [])

  yield* sagaManager.start(
    `${CONNECT_VIEWMODEL}${sagaKey}`,
    eventListenerSaga,
    {
      ...sagaArgs,
      eventTypes
    },
    action
  )

  while (subscriptionKeys.length > 0) {
    let counter = subscriptionKeys.length
    for (const { aggregateId, eventType } of subscriptionKeys) {
      yield put(subscribeTopicRequest(eventType, aggregateId))
    }

    while (counter > 0) {
      const subscribeResultAction = yield take(action => {
        return (
          (action.type === SUBSCRIBE_TOPIC_SUCCESS ||
            action.type === SUBSCRIBE_TOPIC_FAILURE) &&
          subscriptionKeys.find(
            key =>
              key.aggregateId === action.topicId &&
              key.eventType === action.topicName
          )
        )
      })

      if (subscribeResultAction.type === SUBSCRIBE_TOPIC_SUCCESS) {
        subscriptionKeys = subscriptionKeys.filter(
          key =>
            !(
              key.aggregateId === subscribeResultAction.topicId &&
              key.eventType === subscribeResultAction.topicName
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
