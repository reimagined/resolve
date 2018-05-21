import getIn from 'lodash/get'
import setIn from 'lodash/set'
import { validate } from 'jsonschema'

import schema from '../../configs/schema.resolve.config.json'

const validateConfig = config => {
  try {
    return validate(config, schema, { throwError: true })
  } catch (error) {
    if (typeof error.property === 'string') {
      error.property = error.property.replace('instance.', '')
    }

    // Ignore validation for process.env[KEY]
    let processEnv = null
    try {
      processEnv = getIn(config, error.property)
      if (!/\$ref\/deployOptions\/env\//.test(processEnv)) {
        processEnv = null
      }
    } catch (e) {}

    if (processEnv) {
      let defaultValue = null
      switch (error.argument.join(',')) {
        case 'string':
          defaultValue = ''
          break
        case 'integer':
          defaultValue = 0
          break
      }

      setIn(config, error.property, defaultValue)
      const result = validateConfig(config)
      setIn(config, error.property, processEnv)
      return result
    }

    // eslint-disable-next-line no-throw-literal
    throw `Resolve Config validation failed:
property: ${error.property}
message: ${error.message}`
  }
}

export default validateConfig
