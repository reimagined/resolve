import { USER_REGISTERED } from '../event-types'

const projection = {
  Init: async (store) => {
    await store.defineTable('PersonalDataPlain', {
      indexes: { id: 'string' },
      fields: ['creditCard'],
    })
    await store.defineTable('PersonalDataEncrypted', {
      indexes: { id: 'string' },
      fields: ['creditCard'],
    })
  },
  [USER_REGISTERED]: async (store, event, { decrypt }) => {
    const {
      aggregateId,
      payload: { creditCard },
    } = event

    await store.insert('PersonalDataPlain', {
      id: aggregateId,
      creditCard: decrypt(creditCard),
    })
    await store.insert('PersonalDataEncrypted', {
      id: aggregateId,
      creditCard,
    })
  },
}

export default projection
