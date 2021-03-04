import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  ExtractNewable,
} from './types'

const MySQLErrors = Object.freeze({
  // https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html
  ER_SUBQUERY_NO_1_ROW: 1242,
  ER_DIVISION_BY_ZERO: 1365,
  ER_LOCK_DEADLOCK: 1213,
  ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION: 1792,
  ER_LOCK_OR_ACTIVE_TRANSACTION: 1192,
  ER_TOO_MANY_CONCURRENT_TRXS: 1637,
  ER_LOCK_WAIT_TIMEOUT: 1205,
  ER_LOCK_NOWAIT: 3572,
  ER_CON_COUNT_ERROR: 1040,
} as const)

const PassthroughError: PassthroughErrorFactory = Object.assign(
  (function (this: PassthroughErrorInstance): void {
    Error.call(this)
    this.name = 'PassthroughError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PassthroughError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<PassthroughErrorFactory>,
  {
    isPassthroughError(
      error: Error & { errno: string | number },
      includeRuntimeErrors = false
    ) {
      return (
        error != null &&
        error.errno != null &&
        (error.errno === MySQLErrors.ER_CON_COUNT_ERROR ||
          error.errno === MySQLErrors.ER_LOCK_DEADLOCK ||
          error.errno === MySQLErrors.ER_LOCK_NOWAIT ||
          error.errno ===
            MySQLErrors.ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION ||
          error.errno === MySQLErrors.ER_LOCK_OR_ACTIVE_TRANSACTION ||
          error.errno === MySQLErrors.ER_TOO_MANY_CONCURRENT_TRXS ||
          error.errno === MySQLErrors.ER_LOCK_WAIT_TIMEOUT ||
          (!!includeRuntimeErrors &&
            (error.errno === MySQLErrors.ER_SUBQUERY_NO_1_ROW ||
              error.errno === MySQLErrors.ER_DIVISION_BY_ZERO)))
      )
    },
  }
)

export default PassthroughError
