import { take, put } from 'redux-saga/effects'

import { unsubscribeTopicRequest } from './actions'
import {
  UNSUBSCRIBE_TOPIC_FAILURE,
  UNSUBSCRIBE_TOPIC_SUCCESS
} from './action_types'
import { diffTopicName } from './constants'

const unsubscribeReadModelTopicsSaga = function*({ queryId }) {
  while (true) {
    // eslint-disable-next-line no-loop-func
    yield put(unsubscribeTopicRequest(diffTopicName, queryId))

    const unsubscribeResultAction = yield take(
      action =>
        (action.type === UNSUBSCRIBE_TOPIC_SUCCESS ||
          action.type === UNSUBSCRIBE_TOPIC_FAILURE) &&
        diffTopicName === action.topicName &&
        queryId === action.topicId
    )

    if (unsubscribeResultAction.type === UNSUBSCRIBE_TOPIC_SUCCESS) {
      break
    }
  }
}

export default unsubscribeReadModelTopicsSaga
