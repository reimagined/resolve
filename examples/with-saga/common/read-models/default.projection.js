import uuid from 'uuid'

import {
  USER_CREATION_REQUESTED,
  USER_CREATION_CONFIRMED,
  USER_CREATION_REJECTED,
  OUTDATED_USER_DELETED
} from '../event-names'

export default {
  Init: async store => {
    await store.defineTable('Users', {
      indexes: { id: 'string' },
      fields: ['email', 'timestamp']
    })

    await store.defineTable('CreatedUsers', {
      indexes: { id: 'string' },
      fields: ['email', 'timestamp']
    })

    await store.defineTable('Errors', {
      indexes: { id: 'string' },
      fields: ['timestamp', 'message']
    })
  },
  [USER_CREATION_REQUESTED]: async (
    store,
    { aggregateId, payload: { email }, timestamp }
  ) => {
    await store.insert('CreatedUsers', {
      id: aggregateId,
      email,
      timestamp
    })
  },
  [USER_CREATION_CONFIRMED]: async (store, { aggregateId }) => {
    const user = await store.findOne('CreatedUsers', { id: aggregateId })
    await store.insert('Users', user)
    await store.delete('CreatedUsers', { id: aggregateId })
  },
  [USER_CREATION_REJECTED]: async (store, { aggregateId, timestamp }) => {
    const user = await store.findOne('CreatedUsers', { id: aggregateId })

    await store.delete('CreatedUsers', { id: aggregateId })

    await store.insert('Errors', {
      id: uuid.v4(),
      timestamp,
      message: `User with the '${user.email}' email already exists`
    })
  },
  [OUTDATED_USER_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Users', { id: aggregateId })
  }
}
