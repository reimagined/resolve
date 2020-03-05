import { COMMENT_CREATED } from '../comment_events'

export default {
  Init: async store => {
    await store.defineTable('comments', {
      indexes: { id: 'string', target: 'string', targetId: 'string' },
      fields: ['text', 'createdAt']
    })
  },
  [COMMENT_CREATED]: async (store, { aggregateId, timestamp, payload: { text, target, targetId } }) => {
    await store.insert('comments', {
      target,
      targetId,
      id: aggregateId,
      createdAt: timestamp,
      text
    })
  }
}
