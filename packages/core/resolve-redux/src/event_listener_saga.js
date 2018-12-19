import { take, put, select } from 'redux-saga/effects'

import getHash from './get_hash'
import { aggregateVersionsMap, lastTimestampMap } from './constants'
import { CONNECT_VIEWMODEL, DISPATCH_TOPIC_MESSAGE } from './action_types'
import unsubscribeViewModelTopicsSaga from './unsubscribe_view_model_topics_saga'

const eventListenerSaga = function*(
  { viewModels, sagaKey, sagaManager, eventTypes, store },
  connectAction
) {
  while (true) {
    const { message: event } = yield take(
      action =>
        action.type === DISPATCH_TOPIC_MESSAGE &&
        (eventTypes.indexOf(action.message.type) > -1 &&
          (connectAction.aggregateIds === '*' ||
            connectAction.aggregateIds.indexOf(action.message.aggregateId) >
              -1))
    )

    const {
      viewModels: {
        [aggregateVersionsMap]: viewModelAggregateVersionsMap,
        [lastTimestampMap]: viewModelLastTimestampMap
      }
    } = yield select()

    const key = `${connectAction.viewModelName}${getHash(
      connectAction.aggregateIds
    )}${getHash(connectAction.aggregateArgs)}`

    if (!viewModelAggregateVersionsMap.hasOwnProperty(key)) {
      continue
    }

    const lastTimestamp = viewModelLastTimestampMap[key]
    const versionsMap = viewModelAggregateVersionsMap[key]
    if (!versionsMap.hasOwnProperty(event.aggregateId)) {
      versionsMap[event.aggregateId] = 0
    }

    if (
      event.aggregateVersion > versionsMap[event.aggregateId] &&
      event.timestamp >= lastTimestamp
    ) {
      try {
        yield put(event)
        versionsMap[event.aggregateId] = event.aggregateVersion
        viewModelLastTimestampMap[key] = event.timestamp
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error)

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
}

export default eventListenerSaga
