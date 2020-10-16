import { put } from 'redux-saga/effects'

import { DisconnectViewModelAction, dropViewModelState } from './actions'
import { CONNECT_VIEWMODEL } from '../internal/action-types'

const disconnectViewModelSaga = function* (
  sagaArgs: any,
  action: DisconnectViewModelAction
): any {
  const { sagaManager, sagaKey } = sagaArgs
  const { query, selectorId } = action

  yield* sagaManager.stop(`${CONNECT_VIEWMODEL}${sagaKey}`)
  yield put(dropViewModelState(query, selectorId))
}

export default disconnectViewModelSaga
