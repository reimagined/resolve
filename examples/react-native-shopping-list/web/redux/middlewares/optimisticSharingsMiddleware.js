import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_SHARINGS_SYNC,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
  OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE
} from '../actions/optimisticActions'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

const optimisticShoppingListsMiddleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'shareShoppingListForUser'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHARINGS_SHOPPING_LIST_SHARE,
      payload: {
        id: action.payload.userId,
        username: action.payload.username
      }
    })
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'unshareShoppingListForUser'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHARINGS_SHOPPING_LIST_UNSHARE,
      payload: {
        id: action.payload.userId,
        username: action.payload.username
      }
    })
  }

  if (
    action.type === LOAD_READMODEL_STATE_SUCCESS &&
    action.readModelName === 'Default' &&
    action.resolverName === 'users'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHARINGS_SYNC,
      payload: {
        users: action.result
      }
    })
  }

  next(action)
}

export default optimisticShoppingListsMiddleware
