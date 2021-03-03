import givenEvents from '@resolve-js/testing-tools'
import createReadModelAdapter from '@resolve-js/readmodel-lite'

import projection from '../../common/read-models/shopping_lists.projection'
import resolvers from '../../common/read-models/shopping_lists.resolvers'

import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_LIST_RENAMED,
} from '../../common/event_types'

describe('read-models', () => {
  describe('ShoppingLists', () => {
    const aggregateId = '00000000-0000-0000-0000-000000000000'

    let adapter = null
    beforeEach(async () => {
      adapter = createReadModelAdapter({ databaseFile: ':memory:' })
    })

    test('resolver "all" should return an empty array', async () => {
      const shoppingLists = await givenEvents([])
        .readModel({
          name: 'ShoppingLists',
          projection,
          resolvers,
          adapter,
        })
        .all()

      expect(shoppingLists).toEqual([])
    })

    // mdis-start read-model-test
    test('projection "SHOPPING_LIST_CREATED" should create a shopping list', async () => {
      const shoppingLists = await givenEvents([
        {
          aggregateId,
          type: SHOPPING_LIST_CREATED,
          payload: {
            name: 'Products',
          },
        },
      ])
        .readModel({
          name: 'ShoppingLists',
          projection,
          resolvers,
          adapter,
        })
        .all()

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId,
        name: 'Products',
      })
    })
    // mdis-stop read-model-test

    test('projection "SHOPPING_LIST_RENAMED" should rename the shopping list', async () => {
      const shoppingLists = await givenEvents([
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_CREATED,
          payload: {
            name: 'Products',
          },
        },
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_RENAMED,
          payload: {
            name: 'Medicines',
          },
        },
      ])
        .readModel({
          name: 'ShoppingLists',
          projection,
          resolvers,
          adapter,
        })
        .all()

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId,
        name: 'Medicines',
      })
    })

    test('projection "SHOPPING_LIST_REMOVED" should remove the shopping list', async () => {
      const shoppingLists = await givenEvents([
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_CREATED,
          payload: {
            name: 'Products',
          },
        },
        {
          aggregateId: aggregateId,
          type: SHOPPING_LIST_REMOVED,
        },
      ])
        .readModel({
          name: 'ShoppingLists',
          projection,
          resolvers,
          adapter,
        })
        .all()

      expect(shoppingLists.length).toEqual(0)
    })
  })
})
