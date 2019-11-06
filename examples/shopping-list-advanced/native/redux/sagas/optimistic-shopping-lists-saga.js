import { takeEvery, put } from 'redux-saga/effects'
import getNativeChunk from '../../native-chunk'
import {
  OPTIMISTIC_SHOPPING_LIST_SYNC,
  OPTIMISTIC_SHOPPING_LIST_CREATE,
  OPTIMISTIC_SHOPPING_LIST_REMOVE
} from '../action-types'

const {
  resolveRedux: { actionTypes }
} = getNativeChunk()
const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

export default function*() {
  yield takeEvery(
    action =>
      action.type === LOAD_READMODEL_STATE_SUCCESS &&
      action.readModelName === 'ShoppingLists' &&
      action.resolverName === 'all',
    function*(action) {
      yield put({
        type: OPTIMISTIC_SHOPPING_LIST_SYNC,
        payload: action.result
      })
    }
  )

  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'createShoppingList',
    function*(action) {
      yield put({
        type: OPTIMISTIC_SHOPPING_LIST_CREATE,
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
        type: OPTIMISTIC_SHOPPING_LIST_REMOVE,
        payload: {
          id: action.aggregateId,
          name: action.payload.name
        }
      })
    }
  )
}
