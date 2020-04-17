import { Secret } from 'resolve-encryption-base'

const shapeSecret = (secret: Secret, additionalFields: object): object =>
  Object.freeze({
    // [Symbol.for('threadCounter')]: +secret.threadCounter,
    // [Symbol.for('threadId')]: +secret.threadId,
    idx: +secret.idx,
    id: secret.id,
    key: secret.key,
    ...additionalFields
  })

export default shapeSecret
