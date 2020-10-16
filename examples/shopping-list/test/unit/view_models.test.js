import projection from '../../common/view-models/shopping_list.projection'
import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED,
} from '../../common/event_types'

describe('view-models', () => {
  describe('ShoppingList', () => {
    it('projection "SHOPPING_LIST_CREATED" should create a list', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = null
      const event = { aggregateId, payload: { name } }

      expect(projection[SHOPPING_LIST_CREATED](state, event)).toEqual({
        id: aggregateId,
        name,
        list: [],
      })
    })

    it('projection "SHOPPING_LIST_RENAMED" should rename the list', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = {
        id: aggregateId,
        name,
        list: [],
      }
      const event = { payload: { name: 'renamed' } }

      expect(projection[SHOPPING_LIST_RENAMED](state, event)).toEqual({
        id: aggregateId,
        name: 'renamed',
        list: [],
      })
    })

    it('projection "SHOPPING_LIST_REMOVED" should remove the list', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = {
        id: aggregateId,
        name,
        list: [],
      }
      const event = {}

      expect(projection[SHOPPING_LIST_REMOVED](state, event)).toEqual({
        removed: true,
      })
    })

    it('projection "SHOPPING_ITEM_CREATED" should create a item', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = {
        id: aggregateId,
        name,
        list: [],
      }
      const event = { payload: { id: 'id', text: 'text' } }

      expect(projection[SHOPPING_ITEM_CREATED](state, event)).toEqual({
        id: aggregateId,
        name,
        list: [
          {
            id: 'id',
            text: 'text',
            checked: false,
          },
        ],
      })
    })

    it('projection "SHOPPING_ITEM_TOGGLED" should toggle the item', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = {
        id: aggregateId,
        name,
        list: [
          {
            id: 'id',
            text: 'text',
            checked: false,
          },
        ],
      }
      const event = { payload: { id: 'id', text: 'text' } }

      expect(projection[SHOPPING_ITEM_TOGGLED](state, event)).toEqual({
        id: aggregateId,
        name,
        list: [
          {
            id: 'id',
            text: 'text',
            checked: true,
          },
        ],
      })
    })

    it('projection "SHOPPING_ITEM_REMOVED" should remove the item', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = {
        id: aggregateId,
        name,
        list: [
          {
            id: 'id',
            text: 'text',
            checked: true,
          },
        ],
      }
      const event = { payload: { id: 'id' } }

      expect(projection[SHOPPING_ITEM_REMOVED](state, event)).toEqual({
        id: aggregateId,
        name,
        list: [],
      })
    })
  })
})
