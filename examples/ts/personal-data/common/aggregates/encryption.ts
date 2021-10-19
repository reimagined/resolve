import { AggregateEncryptionFactory } from '@resolve-js/core'
import factory from '../encryption-factory'

const createEncryption: AggregateEncryptionFactory = (aggregateId, context) =>
  factory(aggregateId, context.secretsManager)

export default createEncryption
