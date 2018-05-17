import {
  USER_CREATION_REQUESTED,
  USER_CREATION_CONFIRMED,
  USER_CREATION_REJECTED,
  OUTDATED_USER_DELETED
} from '../../event-names'

export default {
  Init: async store => {
    await store.defineTable('Users', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'email', type: 'string' },
      { name: 'creationTime', type: 'number' }
    ])

    await store.defineTable('CreatedUsers', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'email', type: 'string' },
      { name: 'creationTime', type: 'number' }
    ])
  },
  [USER_CREATION_REQUESTED]: async (
    store,
    { aggregateId, payload: { email }, timestamp }
  ) => {
    await store.insert('CreatedUsers', {
      id: aggregateId,
      email,
      creationTime: timestamp
    })
  },
  [USER_CREATION_CONFIRMED]: async (store, { aggregateId }) => {
    const user = await store.findOne('CreatedUsers', { id: aggregateId })
    await store.insert('Users', user)
    await store.delete('CreatedUsers', { id: aggregateId })
  },
  [USER_CREATION_REJECTED]: async (store, { aggregateId }) => {
    await store.delete('CreatedUsers', { id: aggregateId })
  },
  [OUTDATED_USER_DELETED]: async (store, { aggregateId }) => {
    await store.delete('Users', { id: aggregateId })
  }
}
