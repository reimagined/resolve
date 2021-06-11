import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_LIST_RENAMED,
} from '../event-types'
const projection = {
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
  [SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
    await store.delete('ShoppingLists', { id: aggregateId })
  },
  [SHOPPING_LIST_RENAMED]: async (
    store,
    { aggregateId, payload: { name } }
  ) => {
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { name } })
  },
}
export default projection
