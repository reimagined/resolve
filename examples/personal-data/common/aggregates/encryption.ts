import { AggregateEncryptionFactory } from 'resolve-core'
import factory from '../encryptionFactory'

const createEncryption: AggregateEncryptionFactory = (aggregateId, context) =>
  factory(aggregateId, context.secretsManager)

export default createEncryption
