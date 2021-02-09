import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  ExtractNewable,
} from './types'

const PassthroughError: PassthroughErrorFactory = Object.assign(
  (function (this: PassthroughErrorInstance, isRuntimeError: boolean): void {
    Error.call(this)
    this.name = 'PassthroughError'
    this.isRuntimeError = isRuntimeError
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PassthroughError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<PassthroughErrorFactory>,
  {
    isPassthroughError: (
      error: Error & { code: string | number },
      includeRuntimeErrors = false
    ): boolean => {
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
    },
  }
)

export default PassthroughError
