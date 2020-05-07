import factory from '../encryptionFactory'

const createEncryption = (aggregateId, context) =>
  factory(aggregateId, context.secretsManager)

export default createEncryption
