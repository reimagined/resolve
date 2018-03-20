import aggregates from '../../common/aggregates'

const [todoAggregate] = aggregates

describe('aggregates', () => {
  describe('Todo', () => {
    it('command "createItem" should create an event to create a item', () => {
      const state = undefined
      const command = { payload: { id: 'id', text: 'text' } }

      expect(todoAggregate.commands.createItem(state, command)).toEqual({
        type: 'ITEM_CREATED',
        payload: { id: command.payload.id, text: command.payload.text }
      })
    })

    it('command "toggleItem" should create an event to toggle the item', () => {
      const state = undefined
      const command = { payload: { id: 'id' } }

      expect(todoAggregate.commands.toggleItem(state, command)).toEqual({
        type: 'ITEM_TOGGLED',
        payload: { id: command.payload.id }
      })
    })

    it('command "removeItem" should create an event to remove the item', () => {
      const state = undefined
      const command = { payload: { id: 'id' } }

      expect(todoAggregate.commands.removeItem(state, command)).toEqual({
        type: 'ITEM_REMOVED',
        payload: { id: command.payload.id }
      })
    })
  })
})
