import { takeEvery, put } from 'redux-saga/effects'
import { internal } from '@resolve-js/redux'
import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_REMOVE_SHOPPING_LIST,
  OPTIMISTIC_SYNC,
} from '../actions/optimistic_actions'
const { SEND_COMMAND_SUCCESS, QUERY_READMODEL_SUCCESS } = internal.actionTypes
export function* optimisticShoppingListsSaga() {
  yield takeEvery(
    (action) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'createShoppingList',
    function* (action) {
      yield put({
        type: OPTIMISTIC_CREATE_SHOPPING_LIST,
        payload: {
          id: action.command.aggregateId,
          name: action.command.payload.name,
        },
      })
    }
  )
  yield takeEvery(
    (action) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'removeShoppingList',
    function* (action) {
      yield put({
        type: OPTIMISTIC_REMOVE_SHOPPING_LIST,
        payload: {
          id: action.command.aggregateId,
        },
      })
    }
  )
  yield takeEvery(
    (action) => action.type === QUERY_READMODEL_SUCCESS,
    function* (action) {
      yield put({
        type: OPTIMISTIC_SYNC,
        payload: {
          originalLists: action.result.data,
        },
      })
    }
  )
}
