import { HttpError } from '@resolve-js/client'
import { v4 as uuid } from 'uuid'

const resolvers = {
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
  assertSecretsManager: async (store, params, { secretsManager }) => {
    const secretId = uuid()

    await secretsManager.setSecret(secretId, 'secret-value')
    const secretValue = await secretsManager.getSecret(secretId)
    await secretsManager.deleteSecret(secretId)

    return {
      secretValue,
    }
  },
}

export default resolvers
