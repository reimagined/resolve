export default {
  Init: async store => {
    await store.defineTable('Lists', {
      indexes: { id: 'string' },
      fields: ['title']
    })
  },
  LIST_CREATED: async (store, { aggregateId, payload: { title } }) => {
    await store.insert('Lists', {
      id: aggregateId,
      title
    })
  },
  LIST_REMOVED: async (store, { aggregateId }) => {
    await store.delete('Lists', { id: aggregateId })
  }
}
