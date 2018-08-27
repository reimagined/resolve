import jwt from 'jsonwebtoken'

import commands from '../../aggregates/shopping_list.commands'
import { SHOPPING_LIST_CREATED } from '../../event_types'
import jwtSecret from '../../auth/jwt_secret'

describe('aggregates', () => {
  describe('ShoppingList', () => {
    it('command "createShoppingItem" should create an event to create a item', () => {
      const name = 'test'
      const userId = 'userId'

      const jwtToken = jwt.sign({ id: userId }, jwtSecret)

      const state = {}
      const command = { payload: { name, userId } }

      expect(commands.createShoppingList(state, command, jwtToken)).toEqual({
        type: SHOPPING_LIST_CREATED,
        payload: { name, userId }
      })
    })
  })
})
