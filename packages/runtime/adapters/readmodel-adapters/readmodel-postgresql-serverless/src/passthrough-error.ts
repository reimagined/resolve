import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  PassthougthErrorLike,
  ExtractNewable,
} from './types'

const checkFormalError = (
  error: PassthougthErrorLike,
  value: string
): boolean => error.name === value || error.code === value
const checkFuzzyError = (error: PassthougthErrorLike, value: RegExp): boolean =>
  value.test(error.message) || value.test(error.stack)

const PassthroughError: PassthroughErrorFactory = Object.assign(
  (function (
    this: PassthroughErrorInstance,
    lastTransactionId: string,
    isRetryable: boolean
  ): void {
    Error.call(this)
    this.name = 'PassthroughError'
    this.lastTransactionId = lastTransactionId
    this.isRetryable = isRetryable
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PassthroughError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<PassthroughErrorFactory>,
  {
    isShortCircuitPassthroughError(error: PassthougthErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(error, /Request timed out/i) ||
          checkFuzzyError(error, /Remaining connection slots are reserved/i) ||
          checkFuzzyError(error, /I\/O error occurr?ed/i) ||
          checkFuzzyError(error, /too many clients already/i) ||
          checkFuzzyError(error, /in a read-only transaction/i) ||
          checkFormalError(error, 'ThrottlingException') ||
          checkFormalError(error, 'ServiceUnavailable') ||
          checkFormalError(error, 'InternalFailure'))
      )
    },
    isRetryablePassthroughError(error: PassthougthErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(error, /Transaction .*? Is Not Found/i) ||
          checkFuzzyError(error, /Transaction is expired/i) ||
          checkFuzzyError(error, /Invalid transaction ID/i) ||
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
    isRegularFatalPassthroughError(error: PassthougthErrorLike): boolean {
      return error != null && checkFuzzyError(error, /could not obtain lock/i)
    },
    isRuntimeFatalPassthroughError(error: PassthougthErrorLike): boolean {
      return (
        error != null &&
        (checkFuzzyError(error, /subquery used as an expression/i) ||
          checkFuzzyError(error, /division by zero/i))
      )
    },
    isPassthroughError(
      error: PassthougthErrorLike,
      includeRuntimeErrors = false
    ): boolean {
      return (
        (!!includeRuntimeErrors &&
          PassthroughError.isRuntimeFatalPassthroughError(error) &&
          PassthroughError.isShortCircuitPassthroughError(error)) ||
        PassthroughError.isRetryablePassthroughError(error) ||
        PassthroughError.isRegularFatalPassthroughError(error)
      )
    },
    maybeThrowPassthroughError: (
      error: PassthougthErrorLike,
      transactionId: string | null
    ): void => {
      if (!PassthroughError.isPassthroughError(error, false)) {
        throw error
      } else if (PassthroughError.isRetryablePassthroughError(error)) {
        throw new PassthroughError(transactionId, true)
      } else if (PassthroughError.isShortCircuitPassthroughError(error)) {
        return
      } else {
        throw new PassthroughError(transactionId, false)
      }
    },
  }
)

export default PassthroughError
