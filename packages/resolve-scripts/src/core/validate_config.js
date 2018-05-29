import Ajv from 'ajv'

import { schemaResolveConfig } from './constants'

const ajv = new Ajv()

const validateConfig = config => {
  const valid = ajv.validate(schemaResolveConfig, config)

  if (!valid) {
    // eslint-disable-next-line
    console.error('Resolve Config validation failed:')
    // eslint-disable-next-line
    console.error(ajv.errors)

    process.exit(1)
  }
}

export default validateConfig
