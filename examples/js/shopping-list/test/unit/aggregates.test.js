import commands from '../../common/aggregates/shopping-list.commands'
import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED,
} from '../../common/event-types'
describe('aggregates', () => {
  describe('ShoppingList', () => {
    it('command "createShoppingList" should create an event to create a list', () => {
      const name = 'test'
      const state = {}
      const command = { payload: { name } }
      expect(commands.createShoppingList(state, command, undefined)).toEqual({
        type: SHOPPING_LIST_CREATED,
        payload: { name },
      })
    })
    it('command "renameShoppingList" should create an event to rename the list', () => {
      const name = 'test'
      const state = { createdAt: Date.now() }
      const command = { payload: { name } }
      expect(commands.renameShoppingList(state, command, undefined)).toEqual({
        type: SHOPPING_LIST_RENAMED,
        payload: { name },
      })
    })
    it('command "removeShoppingList" should create an event to remove the list', () => {
      const state = { createdAt: Date.now() }
      const command = {}
      expect(commands.removeShoppingList(state, command, undefined)).toEqual({
        type: SHOPPING_LIST_REMOVED,
      })
    })
    it('command "createShoppingItem" should create an event to create a item', () => {
      const state = { createdAt: Date.now() }
      const command = { payload: { id: 'id', text: 'id' } }
      expect(commands.createShoppingItem(state, command, undefined)).toEqual({
        type: SHOPPING_ITEM_CREATED,
        payload: { id: 'id', text: 'id' },
      })
    })
    it('command "toggleShoppingItem" should create an event to toggle the item', () => {
      const state = { createdAt: Date.now() }
      const command = { payload: { id: 'id' } }
      expect(commands.toggleShoppingItem(state, command, undefined)).toEqual({
        type: SHOPPING_ITEM_TOGGLED,
        payload: { id: 'id' },
      })
    })
    it('command "removeShoppingItem" should create an event to remove the item', () => {
      const state = { createdAt: Date.now() }
      const command = { payload: { id: 'id' } }
      expect(commands.removeShoppingItem(state, command, undefined)).toEqual({
        type: SHOPPING_ITEM_REMOVED,
        payload: { id: 'id' },
      })
    })
  })
})
