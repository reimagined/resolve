import { ResolveStore } from 'resolve-readmodel-base'
import { USER_REGISTERED } from '../user-profile.events'

export default {
  Init: async (store: ResolveStore): Promise<void> => {
    await store.defineTable('Users', {
      indexes: { id: 'string' },
      fields: ['profile']
    })
  },
  // The event payload already decrypted by key id
  [USER_REGISTERED]: async (
    store: ResolveStore,
    {
      aggregateId,
      payload: {
        firstName,
        lastName,
        contacts,
        billing,
        simpleField,
        otherData
      }
    }
  ): Promise<void> => {
    await store.insert('Users', {
      id: aggregateId,
      profile: {
        firstName,
        lastName,
        contacts,
        billing,
        simpleField,
        otherData
      }
    })
  }
}
