import givenEvents from '@resolve-js/testing-tools'

import projection from '../../common/read-models/shopping-lists.projection'
import resolvers from '../../common/read-models/shopping-lists.resolvers'

import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_LIST_RENAMED,
} from '../../common/event-types'

describe('read-models', () => {
  describe('ShoppingLists', () => {
    const aggregateId = '00000000-0000-0000-0000-000000000000'

    test('resolver "all" should return an empty array', async () => {
      const shoppingLists = await givenEvents([])
        .readModel({
          name: 'ShoppingLists',
          projection,
          resolvers,
        })
        .query('all', {})

      expect(shoppingLists).toEqual([])
    })

    // mdis-start read-model-test
    test('projection "SHOPPING_LIST_CREATED" should create a shopping list', async () => {
      const shoppingLists: any = await givenEvents([
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
        })
        .query('all', {})

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId,
        name: 'Products',
      })
    })
    // mdis-stop read-model-test

    test('projection "SHOPPING_LIST_RENAMED" should rename the shopping list', async () => {
      const shoppingLists: any = await givenEvents([
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
        })
        .query('all', {})

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
        })
        .query('all', {})

      expect(shoppingLists).toEqual([])
    })
  })
})
