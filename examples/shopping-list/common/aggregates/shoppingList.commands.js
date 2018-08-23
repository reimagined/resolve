import validation from './validation'
import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED
} from '../eventTypes'

export default {
  createShoppingList: (state, { payload: { name } }) => {
    validation.stateIsAbsent(state, 'Shopping List')
    validation.fieldRequired({ name }, 'name')

    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name }
    }
  },
  renameShoppingList: (state, { payload: { name } }) => {
    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ name }, 'name')

    return {
      type: SHOPPING_LIST_RENAMED,
      payload: { name }
    }
  },
  removeShoppingList: (state, { aggregateId }) => {
    validation.stateExists(state, 'Shopping List')
    return {
      type: SHOPPING_LIST_REMOVED,
      payload: { id: aggregateId }
    }
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ id }, 'id')
    validation.fieldRequired({ text }, 'text')

    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    }
  },
  toggleShoppingItem: (state, { payload: { id } }) => {
    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ id }, 'id')

    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id }
    }
  },
  removeShoppingItem: (state, { payload: { id } }) => {
    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ id }, 'id')

    return {
      type: SHOPPING_ITEM_REMOVED,
      payload: { id }
    }
  }
}
