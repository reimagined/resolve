import createAdapter from './create-adapter'
import checkStoreApi from './check-store-api'
import checkTableSchema from './check-table-schema'
import bindWithConnection from './bind-with-connection'
import bindReadModel from './bind-read-model'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  checkStoreApi,
  checkTableSchema,
  bindWithConnection,
  bindReadModel,
  dispose
)
