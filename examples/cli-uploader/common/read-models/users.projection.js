import { USER_CREATED } from '../event-types'

export default {
  Init: async store => {
    await store.defineTable('Users', {
      indexes: { id: 'string' },
      fields: ['login', 'passwordHash']
    })
  },

  [USER_CREATED]: async (
    store,
    { aggregateId, payload: { login, passwordHash } }
  ) => {
    const user = {
      id: aggregateId,
      login,
      passwordHash
    }

    await store.insert('Users', user)
  }
}
