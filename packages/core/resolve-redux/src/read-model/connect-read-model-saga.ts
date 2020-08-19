import { put, call } from 'redux-saga/effects'

import {
  ConnectReadModelAction,
  queryReadModelFailure,
  queryReadModelRequest,
  queryReadModelSuccess
} from './actions'
import { DISCONNECT_READMODEL } from '../action-types'

import { RootSagaArgs } from '../types'

type ConnectReadModelSagaArgs = {
  sagaManager: any
  sagaKey: string
} & RootSagaArgs

const connectReadModelSaga = function*(
  sagaArgs: ConnectReadModelSagaArgs,
  action: ConnectReadModelAction
): any {
  const { sagaManager, sagaKey, client } = sagaArgs
  const { query } = action

  yield* sagaManager.stop(`${DISCONNECT_READMODEL}${sagaKey}`)

  yield put(queryReadModelRequest(query, null))

  try {
    const { timestamp, data } = yield call([client, client.query], query)
    yield put(queryReadModelSuccess(query, data, timestamp))
  } catch (error) {
    yield put(queryReadModelFailure(query, error))
  }
}

export default connectReadModelSaga
