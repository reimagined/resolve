import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  PassthroughErrorLike,
  ExtractNewable,
} from './types'

const PostgresErrors = Object.freeze({
  // https://www.postgresql.org/docs/10/errcodes-appendix.html
  CONNECTION_EXCEPTION: '08000',
  CONNECTION_DOES_NOT_EXIST: '08003',
  CONNECTION_FAILURE: '08006',
  SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION: '08001',
  SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION: '08004',
  DIVISION_BY_ZERO: '22012',
  CARDINALITY_VIOLATION: '21000',
  SERIALIZATION_FAILURE: '40001',
  IN_FAILED_SQL_TRANSACTION: '25P02',
  NO_ACTIVE_SQL_TRANSACTION: '25P01',
  TRANSACTION_ROLLBACK: '40000',
  LOCK_NOT_AVAILABLE: '55P03',
  DEADLOCK_DETECTED: '40P01',
} as const)

const checkFormalError = (
  error: PassthroughErrorLike,
  value: string
): boolean => error.name === value || error.code === value
const checkFuzzyError = (error: PassthroughErrorLike, value: RegExp): boolean =>
  value.test(error.message) || value.test(error.stack)

const PassthroughError: PassthroughErrorFactory = Object.assign(
  (function (this: PassthroughErrorInstance, isRetryable: boolean): void {
    Error.call(this)
    this.name = 'PassthroughError'
    this.isRetryable = isRetryable
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PassthroughError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<PassthroughErrorFactory>,
  {
    isRetryablePassthroughError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(
          error,
          /terminating connection due to serverless scale event timeout/i
        ) ||
          checkFuzzyError(
            error,
            /terminating connection due to administrator command/i
          ) ||
          checkFuzzyError(error, /Connection terminated/i) ||
          checkFuzzyError(error, /Query read timeout/i) ||
          checkFuzzyError(error, /Remaining connection slots are reserved/i) ||
          checkFuzzyError(error, /Too many clients already/i) ||
          checkFuzzyError(error, /Connection terminated unexpectedly/i) ||
          checkFuzzyError(
            error,
            /canceling statement due to statement timeout/i
          ) ||
          checkFormalError(error, 'ECONNRESET') ||
          checkFormalError(error, PostgresErrors.CONNECTION_EXCEPTION) ||
          checkFormalError(error, PostgresErrors.CONNECTION_DOES_NOT_EXIST) ||
          checkFormalError(error, PostgresErrors.CONNECTION_FAILURE) ||
          checkFormalError(
            error,
            PostgresErrors.SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION
          ) ||
          checkFormalError(
            error,
            PostgresErrors.SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION
          ) ||
          checkFormalError(error, PostgresErrors.TRANSACTION_ROLLBACK) ||
          checkFormalError(error, PostgresErrors.NO_ACTIVE_SQL_TRANSACTION) ||
          checkFormalError(error, PostgresErrors.IN_FAILED_SQL_TRANSACTION) ||
          checkFormalError(error, PostgresErrors.SERIALIZATION_FAILURE) ||
          checkFormalError(error, PostgresErrors.DEADLOCK_DETECTED))
      )
    },
    isRegularFatalPassthroughError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        checkFormalError(error, PostgresErrors.LOCK_NOT_AVAILABLE)
      )
    },
    isRuntimeFatalPassthroughError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        (checkFormalError(error, PostgresErrors.CARDINALITY_VIOLATION) ||
          checkFormalError(error, PostgresErrors.DIVISION_BY_ZERO))
      )
    },
    isPassthroughError(
      error: PassthroughErrorLike,
      includeRuntimeErrors = false
    ): boolean {
      return (
        (!!includeRuntimeErrors &&
          PassthroughError.isRuntimeFatalPassthroughError(error)) ||
        PassthroughError.isRetryablePassthroughError(error) ||
        PassthroughError.isRegularFatalPassthroughError(error)
      )
    },
    maybeThrowPassthroughError(
      error: PassthroughErrorLike,
      includeRuntimeErrors = false
    ): void {
      if (!PassthroughError.isPassthroughError(error, includeRuntimeErrors)) {
        throw error
      }
      const isRetryable = PassthroughError.isRetryablePassthroughError(error)
      throw new PassthroughError(isRetryable)
    },
  }
)

export default PassthroughError
