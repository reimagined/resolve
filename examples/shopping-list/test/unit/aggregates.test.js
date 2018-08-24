import commands from '../../common/aggregates/shoppingList.commands'
import { SHOPPING_LIST_CREATED } from '../../common/eventTypes'

describe('aggregates', () => {
  describe('ShoppingList', () => {
    it('command "createShoppingItem" should create an event to create a item', () => {
      const name = 'test'

      const state = {}
      const command = { payload: { name } }

      expect(commands.createShoppingList(state, command)).toEqual({
        type: SHOPPING_LIST_CREATED,
        payload: { name }
      })
    })
  })
})
