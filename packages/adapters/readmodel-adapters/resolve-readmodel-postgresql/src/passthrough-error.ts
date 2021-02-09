import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  ExtractNewable,
} from './types'

const PostgresErrors = Object.freeze({
  // https://www.postgresql.org/docs/10/errcodes-appendix.html
  DIVISION_BY_ZERO: '22012',
  CARDINALITY_VIOLATION: '21000',
  IN_FAILED_SQL_TRANSACTION: '25P02',
  LOCK_NOT_AVAILABLE: '55P03',
  DEADLOCK_DETECTED: '40P01',
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
      error: Error & { code: string | number },
      includeRuntimeErrors = false
    ) {
      return (
        error != null &&
        error.code != null &&
        (`${error.code}` === PostgresErrors.IN_FAILED_SQL_TRANSACTION ||
          `${error.code}` === PostgresErrors.LOCK_NOT_AVAILABLE ||
          `${error.code}` === PostgresErrors.DEADLOCK_DETECTED ||
          (!!includeRuntimeErrors &&
            (`${error.code}` === PostgresErrors.CARDINALITY_VIOLATION ||
              `${error.code}` === PostgresErrors.DIVISION_BY_ZERO)))
      )
    },
  }
)

export default PassthroughError
