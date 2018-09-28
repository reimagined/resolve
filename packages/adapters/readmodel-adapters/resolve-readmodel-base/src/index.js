import buildProjection from './build-projection'
import checkStoreApi from './check-store-api'
import createAdapter from './create-adapter'
import checkTableSchema from './check-table-schema'
import wrapApis from './wrap-apis'
import init from './init'
import reset from './reset'

export default createAdapter.bind(
  null,
  buildProjection,
  checkStoreApi,
  checkTableSchema,
  wrapApis,
  init,
  reset
)
