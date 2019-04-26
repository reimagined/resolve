const projection = {
  Init: async store => {
    await store.defineTable('Stories', {
      indexes: { id: 'string' },
      fields: ['text', 'version', 'active']
    })
  },

  STORY_CREATED: async (store, event) => {
    await store.insert('Stories', {
      id: event.aggregateId,
      text: event.payload,
      active: true,
      version: 0
    })
  },

  STORY_UPDATED: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId
      },
      {
        $set: {
          text: event.payload
        },
        $inc: {
          version: 1
        }
      }
    )
  },

  STORY_FLAGGED_FOR_DELETION: async (store, event) => {
    await store.update(
      'Stories',
      {
        id: event.aggregateId
      },
      {
        $unset: {
          active: true
        }
      }
    )
  },

  STORY_DELETED: async (store, event) => {
    await store.delete('Stories', {
      id: event.aggregateId,
      active: { $ne: true }
    })
  }
}

export default projection
