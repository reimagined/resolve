import createAdapter from './create-adapter'
import {
  ResourceAlreadyExistError,
  ResourceNotExistError
} from './resource-errors'

export default createAdapter

export { ResourceAlreadyExistError, ResourceNotExistError }
