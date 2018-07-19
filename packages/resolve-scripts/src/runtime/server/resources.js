import path from 'path'
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'

const configEntries = interopRequireDefault(
  require(path.join(process.cwd(), './dist/config-entries.js'))
).default
const aggregates = interopRequireDefault(
  require(path.join(process.cwd(), './dist/common/aggregates/index.js'))
).default
const viewModels = interopRequireDefault(
  require(path.join(process.cwd(), './dist/common/view-models/index.js'))
).default
const readModels = interopRequireDefault(
  require(path.join(process.cwd(), './dist/common/read-models/index.js'))
).default
const sagas = interopRequireDefault(
  require(path.join(process.cwd(), './dist/common/sagas/index.js'))
).default
const auth = interopRequireDefault(
  require(path.join(process.cwd(), './dist/auth/index.js'))
).default

module.exports = {
  ...configEntries,
  aggregates,
  viewModels,
  readModels,
  sagas,
  auth
}
