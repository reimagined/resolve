import { ReadModel } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import { MY_AGGREGATE_CREATED, MY_AGGREGATE_DELETED } from '../event-types'

const entities: ReadModel<ResolveStore> = {
  Init: async (store) => {
    await store.defineTable('Aggregates', {
      indexes: {
        id: 'string',
      },
      fields: ['name'],
    })
  },
  [MY_AGGREGATE_CREATED]: async (store, { aggregateId, payload: { name } }) => {
    await store.update(
      'Aggregates',
      { id: aggregateId },
      { $set: { name } },
      { upsert: true }
    )
  },
  [MY_AGGREGATE_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Aggregates', { id: aggregateId })
  },
}

export default entities
