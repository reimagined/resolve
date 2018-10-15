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
    const aggregateId1 = '00000000-0000-0000-0000-000000000000'
    const aggregateId2 = '11111111-1111-1111-1111-111111111111'

    let readModel

    beforeAll(async () => {
      readModel = createReadModel({
        name: 'ShoppingLists',
        projection,
        resolvers
      })
    })

    test('resolver "all" should return an empty array', async () => {
      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists).toEqual([])

      expect(shoppingLists).toMatchSnapshot()
    })

    test('projection "SHOPPING_LIST_CREATED" should create a first shopping list', async () => {
      await readModel.applyEvent({
        aggregateId: aggregateId1,
        type: SHOPPING_LIST_CREATED,
        payload: {
          name: 'Products'
        }
      })

      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId1,
        name: 'Products'
      })

      expect(shoppingLists).toMatchSnapshot()
    })

    test('projection "SHOPPING_LIST_CREATED" should create a second shopping list', async () => {
      await readModel.applyEvent({
        aggregateId: aggregateId2,
        type: SHOPPING_LIST_CREATED,
        payload: {
          name: 'Building materials'
        }
      })

      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists[1]).toMatchObject({
        id: aggregateId2,
        name: 'Building materials'
      })

      expect(shoppingLists).toMatchSnapshot()
    })

    test('projection "SHOPPING_LIST_RENAMED" should rename the second shopping list', async () => {
      await readModel.applyEvent({
        aggregateId: aggregateId2,
        type: SHOPPING_LIST_RENAMED,
        payload: {
          name: 'Medicines'
        }
      })

      const shoppingLists = await readModel.resolvers.all()

      expect(shoppingLists[1]).toMatchObject({
        id: aggregateId2,
        name: 'Medicines'
      })

      expect(shoppingLists).toMatchSnapshot()
    })

    test('projection "SHOPPING_LIST_REMOVED" should remove the second shopping list', async () => {
      const beforeRemoveShoppingListsCount = (await readModel.resolvers.all())
        .length

      await readModel.applyEvent({
        aggregateId: aggregateId2,
        type: SHOPPING_LIST_REMOVED
      })

      const shoppingLists = await readModel.resolvers.all()

      expect(beforeRemoveShoppingListsCount - shoppingLists.length).toEqual(1)

      expect(shoppingLists).toMatchSnapshot()
    })
  })
})
