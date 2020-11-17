import getEventTypes from '../event-types'

export default (options) => {
  const { USER_REGISTERED } = getEventTypes(options)
  return {
    Init: async (store) => {
      await store.defineTable('Users', {
        indexes: { id: 'string' },
        fields: ['profile'],
      })
    },
    [USER_REGISTERED]: async (store, event) => {
      const {
        aggregateId,
        payload: { name },
      } = event

      await store.insert('Users', {
        id: aggregateId,
        profile: {
          name,
        },
      })
    },
  }
}
