import {
  FILE_LOADING_START,
  FILE_LOADING_SUCCESS,
  FILE_LOADING_FAILURE,
  FILE_NOT_LOADED
} from '../event-types'

export default {
  Init: async store => {
    await store.defineTable('Files', {
      indexes: { id: 'string' },
      fields: ['userId', 'projectId', 'status']
    })
  },

  [FILE_NOT_LOADED]: async (
    store,
    { aggregateId, payload: { userId, projectId } }
  ) => {
    const file = {
      id: aggregateId,
      userId,
      projectId,
      status: 'not loaded'
    }

    await store.insert('Files', file)
  },

  [FILE_LOADING_START]: async (store, { aggregateId }) => {
    await store.update(
      'Files',
      { id: aggregateId },
      { $set: { status: 'start' } }
    )
  },

  [FILE_LOADING_SUCCESS]: async (store, { aggregateId }) => {
    await store.update(
      'Files',
      { id: aggregateId },
      { $set: { status: 'success' } }
    )
  },

  [FILE_LOADING_FAILURE]: async (store, { aggregateId }) => {
    await store.update(
      'Files',
      { id: aggregateId },
      { $set: { status: 'failure' } }
    )
  }
}
