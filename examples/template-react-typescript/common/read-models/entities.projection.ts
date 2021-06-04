import {
  ENTITY_CREATED,
  ENTITY_DELETED,
  ENTITY_ITEM_ADDED,
  ENTITY_ITEM_REMOVED,
} from '../event-types'

export default {
  Init: async (store) => {
    await store.defineTable('Entities', {
      indexes: {
        id: 'string',
      },
      fields: ['name', 'createdAt', 'items'],
    })
  },
  [ENTITY_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const entity = {
      id: aggregateId,
      name,
      createdAt: timestamp,
      items: [],
    }

    await store.insert('Entities', entity)
  },
  [ENTITY_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Entities', { id: aggregateId })
  },
  [ENTITY_ITEM_ADDED]: async (
    store,
    { aggregateId, payload: { itemName } }
  ) => {
    const entity = await store.findOne('Entities', { id: aggregateId })
    await store.update(
      'Entities',
      { id: aggregateId },
      { $set: { items: [...entity.items, itemName] } }
    )
  },
  [ENTITY_ITEM_REMOVED]: async (
    store,
    { aggregateId, payload: { itemName } }
  ) => {
    const entity = await store.findOne('Entities', { id: aggregateId })
    await store.update(
      'Entities',
      { id: aggregateId },
      {
        $set: {
          items: entity.items.filter((item) => item !== itemName),
        },
      }
    )
  },
}
