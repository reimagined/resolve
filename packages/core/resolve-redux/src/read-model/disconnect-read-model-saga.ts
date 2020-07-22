import { put } from 'redux-saga/effects'

import { DisconnectReadModelAction, dropReadModelResult } from './actions'
import { CONNECT_READMODEL } from '../action-types'
import { RootSagaArgs } from '../types'

type DisconnectReadModelSagaArgs = {
  sagaManager: any
  sagaKey: string
} & RootSagaArgs

const disconnectReadModelSaga = function*(
  sagaArgs: DisconnectReadModelSagaArgs,
  action: DisconnectReadModelAction
): any {
  const { sagaManager, sagaKey } = sagaArgs
  const { readModelName, resolverName, resolverArgs } = action

  yield* sagaManager.stop(`${CONNECT_READMODEL}${sagaKey}`)

  yield put(dropReadModelResult(readModelName, resolverName, resolverArgs))
}

export default disconnectReadModelSaga
