import { ReadModel } from 'resolve-query'
import { ResolveStore } from 'resolve-readmodel-base'
import {
  USER_PROFILE_DELETED,
  USER_PROFILE_UPDATED,
  USER_REGISTERED
} from '../user-profile.events'

const readModel: ReadModel<ResolveStore> = {
  Init: async (store): Promise<void> => {
    await store.defineTable('Users', {
      indexes: { id: 'string' },
      fields: ['profile']
    })
  },
  [USER_REGISTERED]: async (store, event, context): Promise<void> => {
    const {
      aggregateId,
      payload: { nickname, firstName, lastName, contacts }
    } = event

    const { decrypt = (): string => null } = context

    await store.insert('Users', {
      id: aggregateId,
      profile: {
        nickname,
        firstName: decrypt(firstName) || 'unknown',
        lastName: decrypt(lastName) || 'unknown',
        fullName: `${firstName} ${lastName}`,
        contacts: decrypt(contacts) || {}
      }
    })
  },
  [USER_PROFILE_UPDATED]: async (store, event, context): Promise<void> => {
    const {
      aggregateId,
      payload: { firstName, lastName }
    } = event

    const { decrypt = (): string => null } = context

    const user = await store.findOne('Users', { id: aggregateId })

    await store.update(
      'Users',
      { id: aggregateId },
      {
        $set: {
          profile: {
            ...user.profile,
            firstName: decrypt(firstName) || 'unknown',
            lastName: decrypt(lastName) || 'unknown'
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
  }
}

export default readModel
