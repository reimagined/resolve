import createAdapter from './create-adapter'
import {
  ResourceAlreadyExistError as SnapshotResourceAlreadyExistError,
  ResourceNotExistError as SnapshotResourceNotExistError
} from './resource-errors'

export default createAdapter

export { SnapshotResourceAlreadyExistError, SnapshotResourceNotExistError }
