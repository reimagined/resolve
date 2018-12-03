import createQuery from './create-query'
import initReadModels from './init-read-models'
import initViewModels from './init-view-models'
import checkInitErrors from './check-init-errors'
import checkQueryDisposeState from './check-query-dispose-state'
import getExecutor from './get-executor'
import read from './read'
import readAndSerialize from './read-and-serialize'
import getLastError from './get-last-error'
import getModelType from './get-model-type'
import getDeserializer from './get-deserializer'
import dispose from './dispose'
import getExecutors from './get-executors'
import updateRequest from './update-request'
import createReadModel from '../read-model'
import createViewModel from '../view-model'

export default createQuery.bind(
  null,
  createReadModel,
  createViewModel,
  initReadModels,
  initViewModels,
  checkInitErrors,
  checkQueryDisposeState,
  getExecutor,
  read,
  readAndSerialize,
  getLastError,
  getModelType,
  getDeserializer,
  dispose,
  getExecutors,
  updateRequest
)
