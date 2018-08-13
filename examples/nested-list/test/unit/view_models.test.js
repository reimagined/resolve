import todosProjection from '../../common/view-models/todos.projection'
import listsProjection from '../../common/view-models/lists.projection'

describe('view-models', () => {
  describe('Lists', () => {
    it('projection "LIST_CREATED" should create a list', () => {
      const state = [
        {
          id: 'id1',
          title: 'title1'
        }
      ]
      const event = { aggregateId: 'id2', payload: { title: 'title2' } }

      expect(listsProjection['LIST_CREATED'](state, event)).toEqual([
        {
          id: 'id1',
          title: 'title1'
        },
        {
          id: 'id2',
          title: 'title2'
        }
      ])
    })

    it('projection "LIST_REMOVED" should remove the item', () => {
      const state = [
        {
          id: 'id1',
          title: 'title1'
        }
      ]
      const event = { aggregateId: 'id1' }

      expect(listsProjection['LIST_REMOVED'](state, event)).toEqual([])
    })
  })

  describe('Todos', () => {
    it('projection "ITEM_CREATED" should create a item', () => {
      const state = {
        id1: {
          text: 'text1',
          checked: false
        }
      }
      const event = { payload: { id: 'id2', text: 'text2' } }

      expect(todosProjection['ITEM_CREATED'](state, event)).toEqual({
        id1: {
          text: 'text1',
          checked: false
        },
        id2: {
          text: 'text2',
          checked: false
        }
      })
    })

    it('projection "ITEM_TOGGLED" should toggle the item', () => {
      const state = {
        id1: {
          text: 'text1',
          checked: false
        }
      }
      const event = { payload: { id: 'id1' } }

      expect(todosProjection['ITEM_TOGGLED'](state, event)).toEqual({
        id1: {
          text: 'text1',
          checked: true
        }
      })
    })

    it('projection "ITEM_REMOVED" should remove the item', () => {
      const state = {
        id1: {
          text: 'text1',
          checked: false
        }
      }
      const event = { payload: { id: 'id1' } }

      expect(todosProjection['ITEM_REMOVED'](state, event)).toEqual({})
    })
  })
})
