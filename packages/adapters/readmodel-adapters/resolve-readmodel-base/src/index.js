import createAdapter from './create-adapter'
import bindWithConnection from './bind-with-connection'
import bindReadModel from './bind-read-model'
import read from './read'
import readAndSerialize from './read-and-serialize'
import updateByEvents from './update-by-events'
import disposeReadModel from './dispose-read-model'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  bindWithConnection,
  bindReadModel,
  read,
  readAndSerialize,
  updateByEvents,
  disposeReadModel,
  dispose
)
