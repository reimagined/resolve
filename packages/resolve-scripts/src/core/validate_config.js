import { validate } from 'jsonschema';

const schema = require('../../configs/schema.resolve.config.json');

export default function validateConfig(config) {
  try {
    return validate(config, schema, { throwError: true });
  } catch (error) {
    // eslint-disable-next-line
    throw `Resolve Config validation failed:
    property: ${error.property}
    message: ${error.message}`;
  }
}
