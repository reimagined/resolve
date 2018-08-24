import jwt from 'jsonwebtoken'

import commands from '../../aggregates/shoppingList.commands'
import { SHOPPING_LIST_CREATED } from '../../eventTypes'
import jwtSecret from '../../auth/jwtSecret'

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
