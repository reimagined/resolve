import { NOTE_CREATED, NOTE_MODIFIED, NOTE_DELETED } from '../event-types'

export default {
  Init: async (store) => {
    await store.defineTable('Notes', {
      indexes: {
        id: 'string',
      },
      fields: ['text', 'modifiedAt'],
    })
  },
  [NOTE_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { text } }
  ) => {
    const note = {
      id: aggregateId,
      text,
      modifiedAt: timestamp,
    }

    await store.insert('Notes', note)
  },
  [NOTE_MODIFIED]: async (store, { aggregateId, payload: { text } }) => {
    await store.update('Notes', { id: aggregateId }, { $set: { text } })
  },
  [NOTE_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Notes', { id: aggregateId })
  },
}
