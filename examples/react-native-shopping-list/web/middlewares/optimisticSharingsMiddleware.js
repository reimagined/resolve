import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_SHARE_SHOPPING_LIST,
  OPTIMISTIC_UNSHARE_SHOPPING_LIST
} from '../../common/eventTypes'

const { SEND_COMMAND_SUCCESS } = actionTypes

const optimisticShoppingListsMiddleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'shareShoppingListForUser'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHARE_SHOPPING_LIST,
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
      type: OPTIMISTIC_UNSHARE_SHOPPING_LIST,
      payload: {
        id: action.payload.userId,
        username: action.payload.username
      }
    })
  }

  next(action)
}

export default optimisticShoppingListsMiddleware
