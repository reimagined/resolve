import Ajv from 'ajv'
// import jsonSchemaDraft07 from 'ajv/lib/refs/json-schema-draft-07.json'

import { schemaResolveConfig } from './constants'

const ajv = new Ajv()
// ajv.addMetaSchema(jsonSchemaDraft07);

const validateConfig = config => {
  const valid = ajv.validate(schemaResolveConfig, config)

  if (!valid) {
    console.error('Resolve Config validation failed:')
    console.error(ajv.errors)

    process.exit(1)
  }
}

export default validateConfig
