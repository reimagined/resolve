import { put } from 'redux-saga/effects'

import {
  sendCommandSuccess,
  sendCommandFailure,
  dispatchTopicMessage
} from './actions'

const sendCommandSaga = function*(
  { api },
  { commandType, aggregateId, aggregateName, payload }
) {
  try {
    const event = yield api.sendCommand({
      commandType,
      aggregateId,
      aggregateName,
      payload
    })

    yield put(
      sendCommandSuccess(commandType, aggregateId, aggregateName, payload)
    )

    yield put(dispatchTopicMessage(event))
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
