import { ReadModel } from '@resolve-js/core'
import { NOTE_CREATED, NOTE_DELETED } from '../event-types'

const projection: ReadModel<any> = {
  Init: async (store) => {
    await store.defineTable('Notes', {
      indexes: {
        id: 'string',
      },
      fields: [],
    })
  },
  [NOTE_CREATED]: async (store, { aggregateId }) => {
    await store.update('Notes', { id: aggregateId }, {}, { upsert: true })
  },
  [NOTE_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Notes', { id: aggregateId })
  },
}

export default projection
