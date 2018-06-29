import { put } from 'redux-saga/effects'

import {
  stopReadModelSubscriptionSuccess,
  stopReadModelSubscriptionFailure
} from './actions'

const stopReadModelSubscriptionSaga = function*({ api }, { queryId }) {
  try {
    yield api.stopReadModelSubscription({
      queryId
    })

    yield put(stopReadModelSubscriptionSuccess(queryId))
  } catch (error) {
    yield put(stopReadModelSubscriptionFailure(queryId, error))
  }
}

export default stopReadModelSubscriptionSaga
