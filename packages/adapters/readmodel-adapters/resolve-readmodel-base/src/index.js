import createAdapter from './create-adapter'
import checkStoreApi from './check-store-api'
import checkTableSchema from './check-table-schema'
import bindWithConnection from './bind-with-connection'
import bindReadModel from './bind-read-model'
import getLastError from './get-last-error'
import loadEvents from './load-events'
import projectionInvoker from './projection-invoker'
import read from './read'
import readAndSerialize from './read-and-serialize'
import updateByEvents from './update-by-events'
import waitEventCausalConsistency from './wait-event-causal-consistency'
import disposeReadModel from './dispose-read-model'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  checkStoreApi,
  checkTableSchema,
  bindWithConnection,
  bindReadModel,
  getLastError,
  loadEvents,
  projectionInvoker,
  read,
  readAndSerialize,
  updateByEvents,
  waitEventCausalConsistency,
  disposeReadModel,
  dispose
)
