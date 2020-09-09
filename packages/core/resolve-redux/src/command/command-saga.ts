import { Action } from 'redux'
import { takeEvery } from 'redux-saga/effects'
import { ChildSagaArgs } from '../types'
import { SEND_COMMAND_REQUEST } from '../internal/action-types'
import sendCommandSaga from './send-command-saga'
import { SendCommandRequestAction } from './actions'

const isSendCommandAction = (
  action: Action
): action is SendCommandRequestAction => action.type === SEND_COMMAND_REQUEST

const commandSaga = function* (sagaArgs: ChildSagaArgs): any {
  yield takeEvery(
    (action: Action) => {
      if (isSendCommandAction(action)) {
        return !action.usedByHook
      }
      return false
    },
    sendCommandSaga,
    sagaArgs
  )
}

export default commandSaga
