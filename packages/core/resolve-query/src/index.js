import createViewModelAdapter from 'resolve-viewmodel'
import createQuery from './create-query'
import initCustomReadModels from './init-custom-read-models'
import initReadModels from './init-read-models'
import initViewModels from './init-view-models'
import checkInitErrors from './check-init-errors'
import checkQueryDisposeState from './check-query-dispose-state'
import getExecutor from './get-executor'
import read from './read'
import readAndSerialize from './read-and-serialize'
import getLastError from './get-last-error'
import getModelType from './get-model-type'
import dispose from './dispose'
import getExecutors from './get-executors'
import updateRequest from './update-request'
import * as constants from './constants'

export default createQuery.bind(
  null,
  initCustomReadModels,
  initReadModels,
  initViewModels,
  createViewModelAdapter,
  checkInitErrors,
  checkQueryDisposeState,
  getExecutor,
  read,
  readAndSerialize,
  getLastError,
  getModelType,
  dispose,
  getExecutors,
  updateRequest
)

export { constants }
