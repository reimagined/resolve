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
  const { readModelName, resolverName, resolverArgs } = action

  yield* sagaManager.stop(`${DISCONNECT_READMODEL}${sagaKey}`)

  yield put(queryReadModelRequest(readModelName, resolverName, resolverArgs))

  try {
    const { timestamp, data } = yield call([client, client.query], {
      name: readModelName,
      resolver: resolverName,
      args: resolverArgs
    })
    yield put(
      queryReadModelSuccess(
        readModelName,
        resolverName,
        resolverArgs,
        data,
        timestamp
      )
    )
  } catch (error) {
    yield put(
      queryReadModelFailure(readModelName, resolverName, resolverArgs, error)
    )
  }
}

export default connectReadModelSaga
