import { put } from 'redux-saga/effects'

import { API, HttpError } from './create_api'
import {
  sendCommandSuccess,
  sendCommandFailure,
  dispatchTopicMessage
} from './actions'

const CONCURRENT_ERROR_RETRY_COUNT = 3
const CONCURRENT_ERROR_CODE = 408

const sendCommandSaga = function*(
  { api }: { api: API },
  {
    commandType,
    aggregateId,
    aggregateName,
    payload
  }: {
    type: string
    commandType: string
    aggregateId: string
    aggregateName: string
    payload: any
  }
): any {
  let event = null
  let lastError = null
  try {
    for (let index = 0; index < CONCURRENT_ERROR_RETRY_COUNT; index++) {
      try {
        event = yield api.sendCommand({
          commandType,
          aggregateId,
          aggregateName,
          payload
        })

        lastError = null
        break
      } catch (error) {
        lastError = error

        if (
          error instanceof HttpError &&
          error.code === CONCURRENT_ERROR_CODE
        ) {
          continue
        } else {
          break
        }
      }
    }

    if (lastError != null) {
      throw lastError
    }

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
