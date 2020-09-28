export default {
  get: async (store, { userId }) => {
    const plainEntry = await store.findOne('PersonalDataPlain', { id: userId })
    const encryptedEntry = await store.findOne('PersonalDataEncrypted', {
      id: userId,
    })

    if (plainEntry == null || encryptedEntry == null) {
      return null
    }

    return {
      id: userId,
      plainCreditCard: plainEntry.creditCard,
      encryptedCreditCard: encryptedEntry.creditCard,
    }
  },
}
