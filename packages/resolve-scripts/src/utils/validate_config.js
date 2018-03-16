import { validate } from 'jsonschema'

import schema from '../configs/schema.resolve.config.js'

export default function validateConfig(config) {
  try {
    return validate(config, schema, { throwError: true })
  } catch (error) {
    throw new Error(`${error.property} ${error.message}`)
  }
}
