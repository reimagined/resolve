import { put } from 'redux-saga/effects'

import { authSuccess, authFailure } from './actions'

const authSaga = function*({ api }, { url, body, method }) {
  try {
    yield api.request({
      url,
      body,
      method
    })
    yield put(authSuccess(url, body, method))
  } catch (error) {
    yield put(authFailure(url, body, method, error))
  }
}

export default authSaga
