import path from 'path'
import minimist from 'minimist'
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'

const distDir = JSON.parse(minimist(process.argv.slice(2)).distDir)

const requireAssembly = filename =>
  interopRequireDefault(require(path.resolve(process.cwd(), distDir, filename)))
    .default

const aggregates = requireAssembly('common/aggregates/index.js')
const viewModels = requireAssembly('common/view-models/index.js')
const readModels = requireAssembly('common/read-models/index.js')
const apiHandlers = requireAssembly('common/api-handlers/index.js')
const sagas = requireAssembly('common/sagas/index.js')
const auth = requireAssembly('common/auth/index.js')
const constants = requireAssembly('common/constants/index.js')
const assemblies = requireAssembly('assemblies.js')

module.exports = {
  aggregates,
  viewModels,
  readModels,
  apiHandlers,
  sagas,
  auth,
  ...constants,
  ...assemblies
}
