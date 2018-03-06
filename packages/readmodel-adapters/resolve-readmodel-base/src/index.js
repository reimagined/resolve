import 'regenerator-runtime/runtime'

import buildProjection from './build-projection'
import checkStoreApi from './check-store-api'
import createAdapter from './create-adapter'
import init from './init'
import reset from './reset'

export default createAdapter.bind(
  null,
  buildProjection,
  checkStoreApi,
  init,
  reset
)
