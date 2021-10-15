import { isServiceBusyError, isTimeoutError } from './errors'
import {
  ConnectionError,
  RequestTimeoutError,
  ServiceBusyError,
} from '@resolve-js/eventstore-base'

const makeKnownError = (error: any): any => {
  if (isServiceBusyError(error)) {
    const busyError = new ServiceBusyError(error.message)
    busyError.stack = error.stack ?? busyError.stack
    return busyError
  } else if (isTimeoutError(error)) {
    const timeoutError = new RequestTimeoutError(error.message)
    timeoutError.stack = error.stack ?? timeoutError.stack
    return timeoutError
  } else if (error instanceof Error) {
    const connectionError = new ConnectionError(error.message)
    connectionError.stack = error.stack ?? connectionError.stack
    return connectionError
  } else {
    return error
  }
}

export default makeKnownError
