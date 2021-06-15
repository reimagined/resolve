import { SHOPPING_LIST_CREATED } from '../eventTypes'

const readModel = {
  Init: async (store) => {
    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string',
      },
      fields: ['createdAt', 'name'],
    })
  },

  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp,
    }

    await store.insert('ShoppingLists', shoppingList)
  },
}

export default readModel
