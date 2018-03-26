import fs from 'fs'
import path from 'path'
import { validate } from 'jsonschema'

const schema = fs.readFileSync(path.resolve(__dirname, '../configs/schema.resolve.config.json'))

export default function validateConfig(config) {
  try {
    return validate(config, schema, { throwError: true })
  } catch (error) {
    throw `Resolve Config ${error.property} ${error.message}`
  }
}
