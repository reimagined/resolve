import { ReadModel } from '@resolve-js/core'
import { ENTITY_CREATED, ENTITY_DELETED } from '../event-types'

const entities: ReadModel<any> = {
  Init: async (store) => {
    await store.defineTable('Entities', {
      indexes: {
        id: 'string',
      },
      fields: ['name'],
    })
  },
  [ENTITY_CREATED]: async (store, { aggregateId, payload: { name } }) => {
    const entity = {
      id: aggregateId,
      name,
    }
    await store.update('Entities', entity, { upsert: true })
  },
  [ENTITY_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Entities', { id: aggregateId })
  },
}

export default entities
