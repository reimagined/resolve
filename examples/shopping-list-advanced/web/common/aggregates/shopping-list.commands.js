import jwt from 'jsonwebtoken'

import jwtSecret from '../auth/jwt-secret'
import validation from './validation'
import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED,
  SHOPPING_LIST_SHARED,
  SHOPPING_LIST_UNSHARED
} from '../event-types'

export default {
  createShoppingList: (state, { payload: { name } }, { jwt: token }) => {
    const { id: userId } = jwt.verify(token, jwtSecret)

    validation.stateIsAbsent(state, 'Shopping List')
    validation.fieldRequired({ name }, 'name')

    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name, userId }
    }
  },
  renameShoppingList: (state, { payload: { name } }, { jwt: token }) => {
    const { id: userId } = jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ name }, 'name')

    return {
      type: SHOPPING_LIST_RENAMED,
      payload: { name, userId }
    }
  },
  removeShoppingList: (state, command, { jwt: token }) => {
    const { id: userId } = jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'Shopping List')

    return {
      type: SHOPPING_LIST_REMOVED,
      payload: { userId }
    }
  },
  createShoppingItem: (state, { payload: { id, text } }, { jwt: token }) => {
    const { id: userId } = jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ id }, 'id')
    validation.fieldRequired({ text }, 'text')

    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text, userId }
    }
  },
  toggleShoppingItem: (state, { payload: { id } }, { jwt: token }) => {
    const { id: userId } = jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ id }, 'id')

    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id, userId }
    }
  },
  removeShoppingItem: (state, { payload: { id } }, { jwt: token }) => {
    const { id: userId } = jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'Shopping List')
    validation.fieldRequired({ id }, 'id')

    return {
      type: SHOPPING_ITEM_REMOVED,
      payload: { id, userId }
    }
  },
  shareShoppingListForUser: (
    state,
    { payload: { userId } },
    { jwt: token }
  ) => {
    jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'User')
    validation.fieldRequired({ userId }, 'userId')
    validation.itemIsNotInArray(
      state.sharing,
      userId,
      'UserId is already in array Sharing'
    )

    return {
      type: SHOPPING_LIST_SHARED,
      payload: { userId }
    }
  },
  unshareShoppingListForUser: (
    state,
    { payload: { userId } },
    { jwt: token }
  ) => {
    jwt.verify(token, jwtSecret)

    validation.stateExists(state, 'User')
    validation.fieldRequired({ userId }, 'userId')
    validation.itemIsInArray(
      state.sharing,
      userId,
      'UserId is not in array Sharing'
    )

    return {
      type: SHOPPING_LIST_UNSHARED,
      payload: { userId }
    }
  }
}
