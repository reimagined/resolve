import { EventHandlerEncryptionFactory } from '@resolve-js/core'
import factory from '../encryption-factory'

const createEncryption: EventHandlerEncryptionFactory = (
  { aggregateId },
  context
) => factory(aggregateId, context.secretsManager)

export default createEncryption
