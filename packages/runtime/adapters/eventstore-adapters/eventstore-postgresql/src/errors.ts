import {
  ConnectionError,
  RequestTimeoutError,
  ServiceBusyError,
  UnrecognizedError,
} from '@resolve-js/eventstore-base'

const checkFormalError = (error: any, value: string): boolean =>
  error.name === value || error.code === value
const checkFuzzyError = (error: any, value: RegExp): boolean =>
  value.test(error.message) || value.test(error.stack)

// https://www.postgresql.org/docs/10/errcodes-appendix.html
export const isConnectionTerminatedError = (error: any): boolean => {
  return (
    error != null &&
    (checkFuzzyError(error, /Connection terminated/i) ||
      checkFuzzyError(
        error,
        /terminating connection due to serverless scale event timeout/i
      ) ||
      checkFuzzyError(
        error,
        /terminating connection due to administrator command/i
      ) ||
      checkFuzzyError(
        error,
        /Client has encountered a connection error and is not queryable/i
      ) ||
      checkFormalError(error, 'ECONNRESET') ||
      checkFormalError(error, '08000') ||
      checkFormalError(error, '08003') ||
      checkFormalError(error, '08006'))
  )
}

export const isTimeoutError = (error: any): boolean => {
  return (
    error != null &&
    (checkFuzzyError(error, /canceling statement due to statement timeout/i) ||
      checkFuzzyError(error, /Query read timeout/i) ||
      checkFuzzyError(error, /timeout expired/i) ||
      checkFormalError(error, 'ETIMEDOUT'))
  )
}

export const isServiceBusyError = (error: any): boolean => {
  return (
    error != null &&
    (checkFuzzyError(error, /too many clients already/i) ||
      checkFuzzyError(error, /remaining connection slots are reserved/i))
  )
}

function extendErrorStack(mainError: Error, origError: any) {
  if (origError.stack) {
    if (mainError.stack) {
      mainError.stack += '\n'
      mainError.stack += origError.stack
    } else {
      mainError.stack = origError.stack
    }
  }
}

export const makeKnownError = (error: any): Error | null => {
  if (isServiceBusyError(error) || isConnectionTerminatedError(error)) {
    const busyError = new ServiceBusyError(error.message)
    extendErrorStack(busyError, error)
    return busyError
  } else if (isTimeoutError(error)) {
    const timeoutError = new RequestTimeoutError(error.message)
    extendErrorStack(timeoutError, error)
    return timeoutError
  } else {
    return null
  }
}

export const makeConnectionError = (error: any): Error => {
  const knownError = makeKnownError(error)
  if (knownError !== null) {
    return knownError
  } else {
    const connectionError = new ConnectionError(error.message)
    extendErrorStack(connectionError, error)
    return connectionError
  }
}

export const makeUnrecognizedError = (error: any): Error => {
  if (error) {
    const unrecognizedError = new UnrecognizedError(error.message)
    extendErrorStack(unrecognizedError, error)
    return unrecognizedError
  } else {
    return new UnrecognizedError('unrecognized error')
  }
}
