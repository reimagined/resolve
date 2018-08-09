import projection from '../../../domain/view-models/shoppingList.projection'

describe('view-models', () => {
  describe('Todos', () => {
    it('projection "SHOPPING_ITEM_CREATED" should create a item', () => {
      const state = [
        {
          id: 'id1',
          text: 'text1',
          checked: false
        }
      ]
      const event = { payload: { id: 'id2', text: 'text2' } }

      expect(projection['ITEM_CREATED'](state, event)).toEqual([
        {
          id: 'id1',
          text: 'text1',
          checked: false
        },
        {
          id: 'id2',
          text: 'text2',
          checked: false
        }
      ])
    })

    it('projection "SHOPPING_ITEM_TOGGLED" should toggle the item', () => {
      const state = [
        {
          id: 'id1',
          text: 'text1',
          checked: false
        }
      ]
      const event = { payload: { id: 'id1' } }

      expect(projection['ITEM_TOGGLED'](state, event)).toEqual([
        {
          id: 'id1',
          text: 'text1',
          checked: true
        }
      ])
    })

    it('projection "SHOPPING_ITEM_REMOVED" should remove the item', () => {
      const state = [
        {
          id: 'id1',
          text: 'text1',
          checked: false
        }
      ]
      const event = { payload: { id: 'id1' } }

      expect(projection['ITEM_REMOVED'](state, event)).toEqual([])
    })
  })
})
