import createViewModelAdapter from 'resolve-viewmodel'
import createQuery from './create-query'
import initReadModels from './init-read-models'
import initViewModels from './init-view-models'
import checkInitErrors from './check-init-errors'
import checkQueryDisposeState from './check-query-dispose-state'
import getExecutor from './get-executor'
import read from './read'
import readAndSerialize from './read-and-serialize'
import getModelType from './get-model-type'
import dispose from './dispose'
import getExecutors from './get-executors'
import * as constants from './constants'

export default createQuery.bind(
  null,
  initReadModels,
  initViewModels,
  createViewModelAdapter,
  checkInitErrors,
  checkQueryDisposeState,
  getExecutor,
  read,
  readAndSerialize,
  getModelType,
  dispose,
  getExecutors
)

export { constants }
