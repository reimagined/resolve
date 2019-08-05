import { takeEvery, put } from 'redux-saga/effects'
import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_REMOVE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

export default function*() {
  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'createShoppingList',
    function*(action) {
      yield put({
        type: OPTIMISTIC_CREATE_SHOPPING_LIST,
        payload: {
          id: action.aggregateId,
          name: action.payload.name
        }
      })
    }
  )

  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'removeShoppingList',
    function*(action) {
      yield put({
        type: OPTIMISTIC_REMOVE_SHOPPING_LIST,
        payload: {
          id: action.aggregateId
        }
      })
    }
  )

  yield takeEvery(
    action => action.type === LOAD_READMODEL_STATE_SUCCESS,
    function*(action) {
      yield put({
        type: OPTIMISTIC_SYNC,
        payload: {
          originalLists: action.result
        }
      })
    }
  )
}
