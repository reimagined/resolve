import { validate } from 'jsonschema'

import { schemaResolveConfig } from './constants'

const validateConfig = config => {
  try {
    return validate(config, schemaResolveConfig, { throwError: true })
  } catch (error) {
    if (typeof error.property === 'string') {
      error.property = error.property.replace('instance.', '')
    }

    // eslint-disable-next-line no-throw-literal
    throw `Resolve Config validation failed:
property: ${error.property}
message: ${error.message}`
  }
}

export default validateConfig
