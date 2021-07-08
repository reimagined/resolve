import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  PassthroughErrorLike,
  ExtractNewable,
} from './types'

const checkFormalError = (
  error: PassthroughErrorLike,
  value: string
): boolean => error.name === value || error.code === value
const checkFuzzyError = (error: PassthroughErrorLike, value: RegExp): boolean =>
  value.test(error.message) || value.test(error.stack)

const PassthroughError: PassthroughErrorFactory = Object.assign(
  (function (
    this: PassthroughErrorInstance,
    lastTransactionId: string,
    isRetryable: boolean,
    isEmptyTransaction: boolean
  ): void {
    Error.call(this)
    this.name = 'PassthroughError'
    this.lastTransactionId = lastTransactionId
    this.isRetryable = isRetryable
    this.isEmptyTransaction = isEmptyTransaction
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PassthroughError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<PassthroughErrorFactory>,
  {
    isShortCircuitPassthroughError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(error, /Request timed out/i) ||
          checkFuzzyError(
            error,
            /terminating connection due to serverless scale event timeout/i
          ) ||
          checkFuzzyError(
            error,
            /terminating connection due to administrator command/i
          ) ||
          checkFuzzyError(error, /Remaining connection slots are reserved/i) ||
          checkFuzzyError(error, /I\/O error occurr?ed/i) ||
          checkFuzzyError(error, /too many clients already/i) ||
          checkFuzzyError(error, /in a read-only transaction/i) ||
          checkFormalError(error, 'ThrottlingException') ||
          checkFormalError(error, 'ServiceUnavailable') ||
          checkFormalError(error, 'InternalFailure'))
      )
    },
    isEmptyTransactionError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(error, /Transaction .*? Is Not Found/i) ||
          checkFuzzyError(error, /Failed to rollback transaction/i) ||
          checkFuzzyError(error, /Transaction is expired/i) ||
          checkFuzzyError(error, /Invalid transaction ID/i))
      )
    },
    isRetryablePassthroughError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        (PassthroughError.isEmptyTransactionError(error) ||
          checkFuzzyError(error, /deadlock detected/i) ||
          checkFuzzyError(error, /canceling statement due to user request/i) ||
          checkFuzzyError(
            error,
            /could not serialize access due to concurrent update/i
          ) ||
          checkFuzzyError(error, /StatementTimeoutException/i) ||
          checkFormalError(error, 'StatementTimeoutException'))
      )
    },
    isRegularFatalPassthroughError(error: PassthroughErrorLike): boolean {
      return error != null && checkFuzzyError(error, /could not obtain lock/i)
    },
    isRuntimeFatalPassthroughError(error: PassthroughErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(error, /subquery used as an expression/i) ||
          checkFuzzyError(error, /division by zero/i))
      )
    },
    isPassthroughError(
      error: PassthroughErrorLike,
      includeRuntimeErrors = false
    ): boolean {
      return (
        (!!includeRuntimeErrors &&
          PassthroughError.isRuntimeFatalPassthroughError(error)) ||
        PassthroughError.isShortCircuitPassthroughError(error) ||
        PassthroughError.isRetryablePassthroughError(error) ||
        PassthroughError.isRegularFatalPassthroughError(error)
      )
    },
    maybeThrowPassthroughError(
      error: PassthroughErrorLike,
      transactionId: string | null,
      includeRuntimeErrors = false
    ): void {
      if (!PassthroughError.isPassthroughError(error, includeRuntimeErrors)) {
        throw error
      } else if (!PassthroughError.isShortCircuitPassthroughError(error)) {
        const isEmptyTransaction = PassthroughError.isEmptyTransactionError(
          error
        )
        const isRetryable = PassthroughError.isRetryablePassthroughError(error)
        throw new PassthroughError(
          transactionId,
          isRetryable,
          isEmptyTransaction
        )
      }
    },
  }
)

export default PassthroughError
