import type { PassthroughErrorInstance, PassthroughErrorFactory } from './types'

const PassthroughError: PassthroughErrorFactory = function (this: PassthroughErrorInstance, isRuntimeError: boolean): void {
  Error.call(this)
  this.name = 'PassthroughError'
  this.isRuntimeError = isRuntimeError
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, PassthroughError)
  } else {
    this.stack = new Error().stack
  }
} as any

PassthroughError.isPassthroughError = (error: any, includeRuntimeErrors: boolean = false): boolean => {
  return (
    error != null &&
    (/cannot rollback - no transaction is active/i.test(error.message) ||
      (!!includeRuntimeErrors && /integer overflow/i.test(error.message)) ||
      error.code === 'SQLITE_ABORT' ||
      error.code === 'SQLITE_BUSY' ||
      error.code === 'SQLITE_READONLY' ||
      error.code === 'SQLITE_INTERRUPT' ||
      error.code === 'SQLITE_LOCKED')
  )
}
  

export default PassthroughError
