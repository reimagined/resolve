import createReadModel from './create-read-model'
import connect from './connect'
import loadEvents from './load-events'
import getLastError from './get-last-error'
import read from './read'
import readAndSerialize from './read-and-serialize'
import updateByEvents from './update-by-events'
import resolverNames from './resolver-names'
import dispose from './dispose'
import projectionInvoker from './projection-invoker'
import waitEventCausalConsistency from './wait-event-causal-consistency'

export default createReadModel.bind(
  null,
  connect,
  loadEvents,
  getLastError,
  read,
  readAndSerialize,
  updateByEvents,
  resolverNames,
  dispose,
  projectionInvoker,
  waitEventCausalConsistency,
  JSON.parse.bind(JSON)
)
