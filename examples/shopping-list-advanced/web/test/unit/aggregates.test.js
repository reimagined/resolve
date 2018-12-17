import JWT from 'jsonwebtoken'

import shoppingListCommands from '../../common/aggregates/shopping-list.commands'
import userCommands from '../../common/aggregates/user.commands'
import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED,
  USER_CREATED,
  USER_NAME_UPDATED
} from '../../common/event-types'
import jwtSecret from '../../common/auth/jwt-secret'

const jwtToken = JWT.sign(
  {
    username: 'root',
    id: '00000000-0000-0000-0000-000000000000',
    role: 'root'
  },
  jwtSecret
)

describe('aggregates', () => {
  describe('ShoppingList', () => {
    it('command "createShoppingList" should create an event to create a list', () => {
      const name = 'test'

      const state = {}
      const command = { payload: { name } }

      expect(
        shoppingListCommands.createShoppingList(state, command, jwtToken)
      ).toMatchObject({
        type: SHOPPING_LIST_CREATED,
        payload: { name }
      })
    })

    it('command "renameShoppingList" should create an event to rename the list', () => {
      const name = 'test'

      const state = { createdAt: Date.now() }
      const command = { payload: { name } }

      expect(
        shoppingListCommands.renameShoppingList(state, command, jwtToken)
      ).toMatchObject({
        type: SHOPPING_LIST_RENAMED,
        payload: { name }
      })
    })

    it('command "removeShoppingList" should create an event to remove the list', () => {
      const state = { createdAt: Date.now() }
      const command = {}

      expect(
        shoppingListCommands.removeShoppingList(state, command, jwtToken)
      ).toMatchObject({
        type: SHOPPING_LIST_REMOVED,
        payload: {}
      })
    })

    it('command "createShoppingItem" should create an event to create a item', () => {
      const state = { createdAt: Date.now() }
      const command = { payload: { id: 'id', text: 'id' } }

      expect(
        shoppingListCommands.createShoppingItem(state, command, jwtToken)
      ).toMatchObject({
        type: SHOPPING_ITEM_CREATED,
        payload: { id: 'id', text: 'id' }
      })
    })

    it('command "toggleShoppingItem" should create an event to toggle the item', () => {
      const state = { createdAt: Date.now() }
      const command = { payload: { id: 'id' } }

      expect(
        shoppingListCommands.toggleShoppingItem(state, command, jwtToken)
      ).toMatchObject({
        type: SHOPPING_ITEM_TOGGLED,
        payload: { id: 'id' }
      })
    })

    it('command "removeShoppingItem" should create an event to remove the item', () => {
      const state = { createdAt: Date.now() }
      const command = { payload: { id: 'id' } }

      expect(
        shoppingListCommands.removeShoppingItem(state, command, jwtToken)
      ).toMatchObject({
        type: SHOPPING_ITEM_REMOVED,
        payload: { id: 'id' }
      })
    })
  })

  describe('User', () => {
    it('command "createUser" should create an event to create a user', () => {
      const username = 'username'
      const passwordHash = 'passwordHash'
      const accessTokenHash = 'accessTokenHash'

      const state = {}
      const command = {
        payload: {
          username,
          passwordHash,
          accessTokenHash
        }
      }

      expect(userCommands.createUser(state, command, jwtToken)).toMatchObject({
        type: USER_CREATED,
        payload: {
          username,
          passwordHash,
          accessTokenHash
        }
      })
    })

    it('command "updateUserName" should create an event to rename the user', () => {
      const username = 'test'

      const state = {
        createdAt: Date.now(),
        userId: '00000000-0000-0000-0000-000000000000'
      }
      const command = { payload: { username } }

      expect(
        userCommands.updateUserName(state, command, jwtToken)
      ).toMatchObject({
        type: USER_NAME_UPDATED,
        payload: { username }
      })
    })
  })
})
