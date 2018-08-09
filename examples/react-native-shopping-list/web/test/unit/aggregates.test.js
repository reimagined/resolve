import commands from '../../../domain/aggregates/shoppingList.commands'

describe('aggregates', () => {
  describe('Todo', () => {
    it('command "createShoppingItem" should create an event to create a item', () => {
      const state = undefined
      const command = { payload: { id: 'id', text: 'text' } }

      expect(commands.createShoppingItem(state, command)).toEqual({
        type: 'SHOPPING_ITEM_CREATED',
        payload: { id: command.payload.id, text: command.payload.text }
      })
    })

    it('command "toggleShoppingItem" should create an event to toggle the item', () => {
      const state = undefined
      const command = { payload: { id: 'id' } }

      expect(commands.toggleShoppingItem(state, command)).toEqual({
        type: 'SHOPPING_ITEM_TOGGLED',
        payload: { id: command.payload.id }
      })
    })

    it('command "removeShoppingItem" should create an event to remove the item', () => {
      const state = undefined
      const command = { payload: { id: 'id' } }

      expect(commands.removeShoppingItem(state, command)).toEqual({
        type: 'SHOPPING_ITEM_REMOVED',
        payload: { id: command.payload.id }
      })
    })
  })
})
