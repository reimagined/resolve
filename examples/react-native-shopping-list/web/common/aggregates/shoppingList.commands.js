import jwt from 'jsonwebtoken'

import jwtSecret from '../../auth/jwtSecret'
import validation from './validation'

export default {
  createList: (state, { payload: { name } }, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validation.stateIsAbsent(state, 'Shopping List')

    return {
      type: 'LIST_CREATED',
      payload: { name, userId }
    }
  },
  renameList: (state, { payload: { name } }, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'Shopping List')

    return {
      type: 'LIST_RENAMED',
      payload: { name, userId }
    }
  },
  createItem: (state, { payload: { id, text } }, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'Shopping List')

    return {
      type: 'ITEM_CREATED',
      payload: { id, text, userId }
    }
  },
  toggleItem: (state, { payload: { id } }, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'Shopping List')

    return {
      type: 'ITEM_TOGGLED',
      payload: { id, userId }
    }
  },
  removeItem: (state, { payload: { id } }, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'Shopping List')

    return {
      type: 'ITEM_REMOVED',
      payload: { id, userId }
    }
  },
  shareShoppingListForUser: (state, { payload: { userId } }, jwtToken) => {
    jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'User')
    validation.itemIsNotInArray(
      state.sharing,
      userId,
      'UserId is already in array Sharing'
    )

    return {
      type: 'SHOPPING_LIST_SHARED',
      payload: { userId }
    }
  },
  unshareShoppingListForUser: (state, { payload: { userId } }, jwtToken) => {
    jwt.verify(jwtToken, jwtSecret)

    validation.stateExists(state, 'User')
    validation.itemIsInArray(
      state.sharing,
      userId,
      'UserId is not in array Sharing'
    )

    return {
      type: 'SHOPPING_LIST_UNSHARED',
      payload: { userId }
    }
  }
}
