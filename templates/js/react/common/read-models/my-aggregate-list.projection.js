import { MY_AGGREGATE_CREATED, MY_AGGREGATE_DELETED } from '../event-types'
const readModel = {
  Init: async (store) => {
    await store.defineTable('Aggregates', {
      indexes: {
        id: 'string',
      },
      fields: ['name', 'extra'],
    })
  },
  [MY_AGGREGATE_CREATED]: async (
    store,
    { aggregateId, payload: { name, extra } }
  ) => {
    await store.update(
      'Aggregates',
      { id: aggregateId },
      { $set: { name, extra } },
      { upsert: true }
    )
  },
  [MY_AGGREGATE_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Aggregates', { id: aggregateId })
  },
}
export default readModel
