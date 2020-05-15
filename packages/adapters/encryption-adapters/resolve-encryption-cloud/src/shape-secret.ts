import { Secret } from 'resolve-encryption-base'

const shapeSecret = (secret: Secret, additionalFields: object): object =>
  Object.freeze({
    id: secret.id,
    key: secret.key,
    ...additionalFields
  })

export default shapeSecret
