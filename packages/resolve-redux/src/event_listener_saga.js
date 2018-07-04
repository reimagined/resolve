import { take, put, select } from 'redux-saga/effects'

import getHash from './get_hash'
import { aggregateVersionsMap } from './constants'
import { CONNECT_VIEWMODEL, DISPATCH_TOPIC_MESSAGE } from './action_types'
import unsubscribeViewModelTopicsSaga from './unsubscribe_view_model_topics_saga'

const eventListenerSaga = function*(
  { viewModels, sagaKey, sagaManager, eventTypes, store },
  connectAction
) {
  let eventQueue = []

  while (true) {
    const { message: event } = yield take(
      action =>
        action.type === DISPATCH_TOPIC_MESSAGE &&
        (eventTypes.indexOf(action.message.type) > -1 &&
          (connectAction.aggregateIds === '*' ||
            connectAction.aggregateIds.indexOf(action.message.agggregateId)))
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
      yield* unsubscribeViewModelTopicsSaga({
        viewModels,
        viewModelName: connectAction.viewModelName,
        aggregateIds: connectAction.aggregateIds
      })

      yield* sagaManager.stop(`${CONNECT_VIEWMODEL}${sagaKey}`, () =>
        store.dispatch({
          ...connectAction,
          skipConnectionManager: true
        })
      )
    }
  }
}

export default eventListenerSaga
