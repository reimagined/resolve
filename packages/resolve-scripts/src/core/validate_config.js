import Ajv from 'ajv'

import { schemaResolveConfig } from './constants'

const ajv = new Ajv()

const validateConfig = config => {
  const valid = ajv.validate(schemaResolveConfig, config)

  if (!valid) {
    throw new Error(
      'Resolve Config validation failed: ' + JSON.stringify(ajv.errors, null, 2)
    )
  }

  return true
}

export default validateConfig
