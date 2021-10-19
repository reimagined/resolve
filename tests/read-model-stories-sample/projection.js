// mdis-start
const projection = {
  // mdis-start defineTable
  Init: async (store) => {
    await store.defineTable('Stories', {
      indexes: { id: 'string' },
      fields: ['text', 'version', 'active'],
    })
  },
  // mdis-stop defineTable
  // mdis-start insert
  STORY_CREATED: async (store, event) => {
    await store.insert('Stories', {
      id: event.aggregateId,
      text: event.payload.text,
      active: true,
      version: 0,
    })
  },
  // mdis-stop insert
  // mdis-start update
  STORY_UPDATED: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId,
      },
      {
        $set: {
          text: event.payload.text,
        },
        $inc: {
          version: 1,
        },
      }
    )
  },
  // mdis-stop update
  STORY_FLAGGED_FOR_DELETION: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId,
      },
      {
        $unset: {
          active: true,
        },
      }
    )
  },
  // mdis-start delete
  STORY_DELETED: async (store, event) => {
    await store.delete('Stories', {
      id: event.aggregateId,
      active: { $ne: true },
    })
  },
}
// mdis-stop delete
export default projection
// mdis-stop
