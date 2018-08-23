import commands from '../../aggregates/shoppingList.commands'
import { SHOPPING_LIST_CREATED } from '../../eventTypes'

describe('aggregates', () => {
  describe('ShoppingList', () => {
    it('command "createShoppingItem" should create an event to create a item', () => {
      const name = 'test'
      const userId = 'userId'

      const state = {}
      const command = { payload: { name, userId } }

      expect(commands.createShoppingList(state, command)).toEqual({
        type: SHOPPING_LIST_CREATED,
        payload: { name, userId }
      })
    })
  })
})
