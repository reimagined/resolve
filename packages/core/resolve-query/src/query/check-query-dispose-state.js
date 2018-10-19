import { errors } from '../constants'

const checkQueryDisposeState = disposePromise => {
  if (disposePromise != null) {
    throw new Error(errors.disposed)
  }
}

export default checkQueryDisposeState
