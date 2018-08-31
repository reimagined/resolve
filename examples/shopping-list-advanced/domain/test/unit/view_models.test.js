import projection from '../../view-models/shopping_list.projection'
import { SHOPPING_LIST_CREATED } from '../../event_types'

describe('view-models', () => {
  describe('ShoppingList', () => {
    it('projection "SHOPPING_LIST_CREATED" should create a item', () => {
      const aggregateId = 'aggregateId'
      const name = 'name'

      const state = null
      const event = { aggregateId, payload: { name } }

      expect(projection[SHOPPING_LIST_CREATED](state, event)).toEqual({
        id: aggregateId,
        name,
        list: []
      })
    })
  })
})
