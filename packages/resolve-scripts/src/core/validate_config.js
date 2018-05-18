import { validate } from 'jsonschema'

import * as schema from '../../configs/schema.resolve.config.json'

const validateConfig = config => {
  try {
    return validate(config, schema, { throwError: true })
  } catch (error) {
    // eslint-disable-next-line no-throw-literal
    throw `Resolve Config validation failed:
property: ${error.property}
message: ${error.message}`
  }
}

export default validateConfig
