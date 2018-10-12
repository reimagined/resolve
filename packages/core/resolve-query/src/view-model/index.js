import createViewModel from './create-view-model'
import init from './init'
import getViewModel from './get-view-model'
import getLastError from './get-last-error'
import read from './read'
import readAndSerialize from './read-and-serialize'
import updateByEvents from './update-by-events'
import dispose from './dispose'
import eventHandler from './event-handler'
import getKey from './get-key'

export default createViewModel.bind(
  null,
  init,
  getViewModel,
  getLastError,
  read,
  readAndSerialize,
  updateByEvents,
  dispose,
  eventHandler,
  getKey
)
