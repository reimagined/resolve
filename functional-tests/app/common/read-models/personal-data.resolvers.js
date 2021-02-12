import { HttpError } from '@reimagined/client'

export default {
  get: async (store, { userId }) => {
    const plainEntry = await store.findOne('PersonalDataPlain', {
      id: userId,
    })
    const encryptedEntry = await store.findOne('PersonalDataEncrypted', {
      id: userId,
    })

    if (plainEntry == null) {
      throw new HttpError(404, 'plain personal data entry not found')
    }
    if (encryptedEntry == null) {
      throw new HttpError(404, 'encrypted personal data entry not found')
    }

    return {
      id: userId,
      plainCreditCard: plainEntry.creditCard,
      encryptedCreditCard: encryptedEntry.creditCard,
    }
  },
}
