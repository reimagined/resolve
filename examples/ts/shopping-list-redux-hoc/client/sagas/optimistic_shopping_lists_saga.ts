import { takeEvery, put } from 'redux-saga/effects'
import { internal } from '@resolve-js/redux'
import { Command } from '@resolve-js/client'

import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_REMOVE_SHOPPING_LIST,
  OPTIMISTIC_SYNC,
} from '../actions/optimistic_actions'

const { SEND_COMMAND_SUCCESS, QUERY_READMODEL_SUCCESS } = internal.actionTypes

export type CommandAction = {
  type: string
  command: Command
}

export type QueryAction = {
  type: string
  result: any
}

export function* optimisticShoppingListsSaga() {
  yield takeEvery(
    (action: CommandAction) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'createShoppingList',
    function* (action: any) {
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
    (action: CommandAction) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'removeShoppingList',
    function* (action: any) {
      yield put({
        type: OPTIMISTIC_REMOVE_SHOPPING_LIST,
        payload: {
          id: action.command.aggregateId,
        },
      })
    }
  )

  yield takeEvery(
    (action: QueryAction) => action.type === QUERY_READMODEL_SUCCESS,
    function* (action: any) {
      yield put({
        type: OPTIMISTIC_SYNC,
        payload: {
          originalLists: action.result.data,
        },
      })
    }
  )
}
