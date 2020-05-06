import { ReadModel } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'
import {
  USER_PROFILE_DELETED,
  USER_PROFILE_UPDATED,
  USER_REGISTERED,
  USER_PERSONAL_DATA_REQUESTED,
  USER_PERSONAL_DATA_GATHERED
} from '../user-profile.events'

const readModel: ReadModel<ResolveStore> = {
  Init: async (store): Promise<void> => {
    await store.defineTable('Users', {
      indexes: { id: 'string' },
      fields: ['profile', 'archive']
    })
  },
  [USER_REGISTERED]: async (store, event, context): Promise<void> => {
    const {
      aggregateId,
      payload: { nickname, firstName, lastName, contacts }
    } = event

    const { decrypt } = context

    const realFirstName = decrypt(firstName as string) || 'unknown'
    const realLastName = decrypt(lastName as string) || 'unknown'

    await store.insert('Users', {
      id: aggregateId,
      profile: {
        nickname,
        firstName: realFirstName,
        lastName: realLastName,
        fullName: `${realFirstName} ${realLastName}`,
        contacts: decrypt(contacts as string) || {}
      }
    })
  },
  [USER_PROFILE_UPDATED]: async (store, event, context): Promise<void> => {
    const {
      aggregateId,
      payload: { firstName, lastName, contacts }
    } = event

    const { decrypt } = context

    const user = await store.findOne('Users', { id: aggregateId })

    await store.update(
      'Users',
      { id: aggregateId },
      {
        $set: {
          profile: {
            ...user.profile,
            firstName: decrypt(firstName as string) || 'unknown',
            lastName: decrypt(lastName as string) || 'unknown',
            contacts: decrypt(contacts as string) || {}
          }
        }
      }
    )
  },
  [USER_PROFILE_DELETED]: async (store, event): Promise<void> => {
    const { aggregateId } = event

    await store.delete('Users', {
      id: aggregateId
    })
  },
  [USER_PERSONAL_DATA_REQUESTED]: async (store, event): Promise<void> => {
    const { aggregateId, timestamp } = event

    await store.update(
      'Users',
      { id: aggregateId },
      {
        $set: {
          archive: {
            url: null,
            timestamp
          }
        }
      }
    )
  },
  [USER_PERSONAL_DATA_GATHERED]: async (store, event): Promise<void> => {
    const {
      aggregateId,
      timestamp,
      payload: { uploadId, token }
    } = event

    await store.update(
      'Users',
      { id: aggregateId },
      {
        $set: {
          archive: {
            id: uploadId,
            token,
            timestamp
          }
        }
      }
    )
  }
}

export default readModel
