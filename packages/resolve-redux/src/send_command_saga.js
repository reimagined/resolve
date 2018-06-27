import { put } from 'redux-saga/effects'

import { sendCommandSuccess, sendCommandFailure } from './actions'

const sendCommandSaga = function*(
  { api },
  { commandType, aggregateId, aggregateName, payload }
) {
  try {
    yield api.sendCommand({
      commandType,
      aggregateId,
      aggregateName,
      payload
    })

    yield put(
      sendCommandSuccess(commandType, aggregateId, aggregateName, payload)
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
}

export default sendCommandSaga
