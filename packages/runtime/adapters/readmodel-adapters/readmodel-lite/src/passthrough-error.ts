import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  ExtractNewable,
} from './types'

const checkSqliteCode = (code: any, sqliteCode: string) => {
  return typeof code === 'string' && code.startsWith(sqliteCode)
}

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
          checkSqliteCode(error.code, 'SQLITE_ABORT') ||
          checkSqliteCode(error.code, 'SQLITE_BUSY') ||
          checkSqliteCode(error.code, 'SQLITE_READONLY') ||
          checkSqliteCode(error.code, 'SQLITE_INTERRUPT') ||
          checkSqliteCode(error.code, 'SQLITE_LOCKED'))
      )
    },
  }
)

export default PassthroughError
