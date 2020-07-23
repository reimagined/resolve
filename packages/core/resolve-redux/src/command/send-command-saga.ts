import { put, call } from 'redux-saga/effects'
import { ChildSagaArgs } from '../types'
import {
  sendCommandFailure,
  sendCommandSuccess,
  SendCommandRequestAction
} from './actions'

const sendCommandSaga = function*(
  args: ChildSagaArgs,
  action: SendCommandRequestAction
): any {
  /*
  const { client } = args
  const { aggregateName, aggregateId, commandType, payload } = action

  try {
    const result = yield call([client, client.command], {
      aggregateName,
      aggregateId,
      type: commandType,
      payload
    })
    yield put(
      sendCommandSuccess(
        commandType,
        aggregateId,
        aggregateName,
        payload,
        result
      )
    )
  } catch (error) {
    yield put(
      sendCommandFailure(
        commandType,
        aggregateId,
        aggregateName,
        payload,
        error
      )
    )
  }
  */
}

export default sendCommandSaga
