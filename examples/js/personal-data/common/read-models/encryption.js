import factory from '../encryption-factory'
const createEncryption = ({ aggregateId }, context) =>
  factory(aggregateId, context.secretsManager)
export default createEncryption
