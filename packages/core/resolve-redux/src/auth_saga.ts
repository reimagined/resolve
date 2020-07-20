import { put } from 'redux-saga/effects'
import { API } from './create_api'

import { authSuccess, authFailure } from './actions'

const authSaga = function*(
  { api }: { api: API },
  {
    url,
    body,
    method
  }: {
    type: string
    url: string
    body: any
    method: string
  }
): any {
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
