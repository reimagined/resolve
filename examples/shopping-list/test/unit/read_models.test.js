import { createReadModel } from 'resolve-testing-tools'

import projection from '../../common/read-models/shopping_lists.projection'
import resolvers from '../../common/read-models/shopping_lists.resolvers'

import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_LIST_RENAMED
} from '../../common/event_types'

describe('read-models', () => {
  describe('ShoppingLists', () => {
    const aggregateId = '00000000-0000-0000-0000-000000000000'

    let readModel

    beforeEach(() => {
      readModel = createReadModel({
        name: 'ShoppingLists',
        projection,
        resolvers
      })
    })

    afterEach(async () => {
      await readModel.dispose()
    })

    test('resolver "all" should return an empty array', async () => {
      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists).toEqual([])
    })

    test('projection "SHOPPING_LIST_CREATED" should create a shopping list', async () => {
      await readModel.applyEvent({
        aggregateId: aggregateId,
        type: SHOPPING_LIST_CREATED,
        payload: {
          name: 'Products'
        }
      })

      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId,
        name: 'Products'
      })
    })

    test('projection "SHOPPING_LIST_RENAMED" should rename the shopping list', async () => {
      await readModel.applyEvents([
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_CREATED,
          payload: {
            name: 'Products'
          }
        },
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_RENAMED,
          payload: {
            name: 'Medicines'
          }
        }
      ])

      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId,
        name: 'Medicines'
      })
    })

    test('projection "SHOPPING_LIST_REMOVED" should remove the shopping list', async () => {
      await readModel.applyEvents([
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_CREATED,
          payload: {
            name: 'Products'
          }
        },
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_REMOVED
        }
      ])

      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists.length).toEqual(0)
    })
  })
})
