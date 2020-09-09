import { put, call } from 'redux-saga/effects'
import { ChildSagaArgs } from '../types'
import {
  sendCommandFailure,
  sendCommandSuccess,
  SendCommandRequestAction,
} from './actions'

const sendCommandSaga = function* (
  args: ChildSagaArgs,
  action: SendCommandRequestAction
): any {
  const { client } = args
  const { command } = action

  try {
    const result = yield call([client, client.command], command)
    yield put(sendCommandSuccess(command, result))
  } catch (error) {
    yield put(sendCommandFailure(command, error))
  }
}

export default sendCommandSaga
