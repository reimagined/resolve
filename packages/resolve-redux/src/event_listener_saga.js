import { take, put, select, fork } from 'redux-saga/effects'
import { delay } from 'redux-saga'

import getHash from './get_hash'
import { aggregateVersionsMap } from './constants'
import { CONNECT_VIEWMODEL, DISPATCH_MQTT_EVENT } from './action_types'

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

    const {
      viewModels: { [aggregateVersionsMap]: viewModelsAggregateVersionsMap }
    } = yield select()

    const key = `${connectAction.viewModelName}${getHash(
      connectAction.aggregateIds
    )}${getHash(connectAction.aggregateArgs)}`

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

export default eventListenerSaga
