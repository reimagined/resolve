import projection from '../../common/view-models/my-aggregate-items.projection'
import { MY_AGGREGATE_ITEM_ADDED } from '../../common/event-types'
describe('view-models', () => {
  describe('MyAggregateItems', () => {
    test('projects MY_AGGREGATE_ITEM_ADDED event correctly', async () => {
      const state = []
      const event = {
        type: MY_AGGREGATE_ITEM_ADDED,
        payload: { itemName: 'Item 0' },
      }
      expect(
        projection[MY_AGGREGATE_ITEM_ADDED](state, event, undefined, undefined)
      ).toEqual(['Item 0'])
    })
  })
})
