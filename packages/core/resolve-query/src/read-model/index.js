import createReadModel from './create-read-model'
import init from './init'
import getModelReadInterface from './get-model-read-interface'
import getLastError from './get-last-error'
import read from './read'
import readAndSerialize from './read-and-serialize'
import updateByEvents from './update-by-events'
import resolverNames from './resolver-names'
import dispose from './dispose'
import projectionInvoker from './projection-invoker'

export default createReadModel.bind(
  null,
  init,
  getModelReadInterface,
  getLastError,
  read,
  readAndSerialize,
  updateByEvents,
  resolverNames,
  dispose,
  projectionInvoker,
  JSON.parse.bind(JSON)
)
