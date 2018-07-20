import path from 'path'
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'

const requireAssembly = filename =>
  interopRequireDefault(require(path.join(process.cwd(), './dist/', filename)))
    .default

const aggregates = requireAssembly('common/aggregates/index.js')
const viewModels = requireAssembly('common/view-models/index.js')
const readModels = requireAssembly('common/read-models/index.js')
const sagas = requireAssembly('common/sagas/index.js')
const auth = requireAssembly('auth/index.js')
const assemblies = requireAssembly('assemblies.js')

module.exports = {
  aggregates,
  viewModels,
  readModels,
  sagas,
  auth,
  ...assemblies
}
