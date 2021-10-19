import { USER_REGISTERED } from '../event-types'

const projection = {
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

export default projection
