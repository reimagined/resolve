import { ReadModelEncryptionFactory } from 'resolve-core'
import factory from '../encryptionFactory'
import { USER_REGISTERED, USER_PROFILE_UPDATED } from '../user-profile.events'

const encryptedEvents = [USER_REGISTERED, USER_PROFILE_UPDATED]

const createEncryption: ReadModelEncryptionFactory = (event, context) => {
  const { type, aggregateId } = event
  if (encryptedEvents.includes(type)) {
    return factory(aggregateId, context.secretsManager)
  }
  return null
}

export default createEncryption
