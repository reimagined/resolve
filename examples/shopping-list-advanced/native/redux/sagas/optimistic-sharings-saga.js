import { takeEvery, put } from 'redux-saga/effects'
import getNativeChunk from '../../native-chunk'
import {
  OPTIMISTIC_SHARINGS_SYNC,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE
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
      action.resolverName === 'sharings',
    function*(action) {
      yield put({
        type: OPTIMISTIC_SHARINGS_SYNC,
        payload: action.result
      })
    }
  )

  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'shareShoppingListForUser',
    function*(action) {
      yield put({
        type: OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
        payload: {
          id: action.payload.userId,
          username: action.payload.username
        }
      })
    }
  )

  yield takeEvery(
    action =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'unshareShoppingListForUser',
    function*(action) {
      yield put({
        type: OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE,
        payload: {
          id: action.payload.userId,
          username: action.payload.username
        }
      })
    }
  )
}
