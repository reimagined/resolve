import { take, put, select } from 'redux-saga/effects'

import getHash from './get_hash'
import { lastTimestampMap } from './constants'
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
      viewModels: { [lastTimestampMap]: viewModelLastTimestampMap }
    } = yield select()

    const key = `${connectAction.viewModelName}${getHash(
      connectAction.aggregateIds
    )}${getHash(connectAction.aggregateArgs)}`

    const lastTimestamp = viewModelLastTimestampMap[key]

    if (event.timestamp >= lastTimestamp) {
      try {
        yield put(event)
        viewModelLastTimestampMap[key] = event.timestamp
      } catch (error) {
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
