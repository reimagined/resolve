import { put } from 'redux-saga/effects'

import {
  stopReadModelSubscriptionSuccess,
  stopReadModelSubscriptionFailure
} from './actions'

const stopReadModelSubscriptionSaga = function*(
  { api },
  { readModelName, resolverName, queryId }
) {
  try {
    yield api.stopReadModelSubscription({
      readModelName,
      resolverName,
      queryId
    })

    yield put(
      stopReadModelSubscriptionSuccess(readModelName, resolverName, queryId)
    )
  } catch (error) {
    yield put(
      stopReadModelSubscriptionFailure(
        readModelName,
        resolverName,
        queryId,
        error
      )
    )
  }
}

export default stopReadModelSubscriptionSaga
