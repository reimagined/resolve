import { actionTypes } from '../../resolve/resolve-redux'

import {
  OPTIMISTIC_SHOPPING_LIST_SYNC,
  OPTIMISTIC_SHOPPING_LIST_CREATE,
  OPTIMISTIC_SHOPPING_LIST_REMOVE
} from '../actionTypes'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

const optimisticShoppingListsMiddleware = store => next => action => {
  if (
    action.type === LOAD_READMODEL_STATE_SUCCESS &&
    action.readModelName === 'Default' &&
    action.resolverName === 'shoppingLists'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHOPPING_LIST_SYNC,
      payload: action.result
    })
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHOPPING_LIST_CREATE,
      payload: {
        id: action.aggregateId,
        name: action.payload.name
      }
    })
  }

  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'removeShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_SHOPPING_LIST_REMOVE,
      payload: {
        id: action.aggregateId,
        name: action.payload.name
      }
    })
  }

  next(action)
}

export default optimisticShoppingListsMiddleware
