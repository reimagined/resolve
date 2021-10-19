import {
  USER_PROFILE_DELETED,
  USER_PROFILE_UPDATED,
  USER_REGISTERED,
  USER_PERSONAL_DATA_REQUESTED,
  USER_PERSONAL_DATA_GATHERED,
} from '../user-profile.events'
const readModel = {
  Init: async (store) => {
    await store.defineTable('Users', {
      indexes: { id: 'string' },
      fields: ['profile', 'archive'],
    })
  },
  [USER_REGISTERED]: async (store, event, { decrypt }) => {
    const {
      aggregateId,
      payload: { nickname, firstName, lastName, contacts },
    } = event
    if (typeof decrypt === 'function') {
      await store.insert('Users', {
        id: aggregateId,
        profile: {
          nickname,
          firstName: decrypt(firstName),
          lastName: decrypt(lastName),
          contacts: decrypt(contacts),
        },
      })
    } else {
      await store.insert('Users', {
        id: aggregateId,
        profile: {
          nickname,
          firstName: '<encrypted>',
          lastName: '<encrypted>',
          contacts: {},
        },
      })
    }
  },
  [USER_PROFILE_UPDATED]: async (store, event, { decrypt }) => {
    const {
      aggregateId,
      payload: { firstName, lastName, contacts },
    } = event
    const user = await store.findOne('Users', { id: aggregateId })
    if (typeof decrypt === 'function') {
      await store.update(
        'Users',
        { id: aggregateId },
        {
          $set: {
            profile: {
              ...user.profile,
              firstName: decrypt(firstName),
              lastName: decrypt(lastName),
              contacts: decrypt(contacts),
            },
          },
        }
      )
    } else {
      await store.update(
        'Users',
        { id: aggregateId },
        {
          $set: {
            profile: {
              ...user.profile,
              firstName: '<encrypted>',
              lastName: '<encrypted>',
              contacts: {},
            },
          },
        }
      )
    }
  },
  [USER_PROFILE_DELETED]: async (store, event) => {
    const { aggregateId } = event
    await store.delete('Users', {
      id: aggregateId,
    })
  },
  [USER_PERSONAL_DATA_REQUESTED]: async (store, event) => {
    const { aggregateId, timestamp } = event
    await store.update(
      'Users',
      { id: aggregateId },
      {
        $set: {
          archive: {
            id: null,
            token: null,
            timestamp,
            error: null,
          },
        },
      }
    )
  },
  [USER_PERSONAL_DATA_GATHERED]: async (store, event) => {
    const {
      aggregateId,
      timestamp,
      payload: { uploadId, token, error },
    } = event
    await store.update(
      'Users',
      { id: aggregateId },
      {
        $set: {
          archive: {
            id: uploadId,
            token,
            timestamp,
            error,
          },
        },
      }
    )
  },
}
export default readModel
