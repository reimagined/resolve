// A Read Model projection describes logic used to collect data from incoming events.
import { SHOPPING_LIST_CREATED } from '../eventTypes'

export default {
  // The 'Init' function initializes the store (defines tables and their fields).
  Init: async (store) => {
    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string',
      },
      fields: ['createdAt', 'name'],
    })
  },
  // A projection function runs once for every event of the specified type.
  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    // Build a data item based on the event data.
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp,
    }
    // Save the data item to the store's table 'ShoppingLists' table.
    await store.insert('ShoppingLists', shoppingList)
  },
}
