import { put } from 'redux-saga/effects'

import { authSuccess, authFailure } from './actions'

const authSaga = function*({ api }, { url, body }) {
  try {
    yield api.request({
      url,
      body
    })
    yield put(authSuccess(url, body))
  } catch (error) {
    yield put(authFailure(url, body, error))
  }
}

export default authSaga
