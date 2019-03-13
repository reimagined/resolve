import createViewModel from './create-view-model'
import init from './init'
import read from './read'
import readAndSerialize from './read-and-serialize'
import dispose from './dispose'
import eventHandler from './event-handler'
import getKey from './get-key'

export default createViewModel.bind(
  null,
  init,
  read,
  readAndSerialize,
  dispose,
  eventHandler,
  getKey
)
