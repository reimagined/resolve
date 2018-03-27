import { validate } from 'jsonschema'

import schema from '../../configs/schema.resolve.config'

export default function validateConfig(config) {
  try {
    return validate(config, schema, { throwError: true })
  } catch (error) {
    throw `Resolve Config ${error.property} ${error.message}`
  }
}
