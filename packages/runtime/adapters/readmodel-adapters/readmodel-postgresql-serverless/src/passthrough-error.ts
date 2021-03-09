import type {
  PassthroughErrorInstance,
  PassthroughErrorFactory,
  ExtractNewable,
} from './types'

const PassthroughError: PassthroughErrorFactory = Object.assign(
  (function (this: PassthroughErrorInstance, lastTransactionId: string): void {
    Error.call(this)
    this.name = 'PassthroughError'
    this.lastTransactionId = lastTransactionId
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PassthroughError)
    } else {
      this.stack = new Error().stack
    }
  } as Function) as ExtractNewable<PassthroughErrorFactory>,
  {
    isPassthroughError(
      error: Error & { code: string | number; stack: string },
      includeRuntimeErrors = false
    ): boolean {
      return (
        error != null &&
        (/Transaction .*? Is Not Found/i.test(error.message) ||
          /Transaction .*? Is Not Found/i.test(error.stack) ||
          /Transaction is expired/i.test(error.message) ||
          /Transaction is expired/i.test(error.stack) ||
          /Invalid transaction ID/i.test(error.message) ||
          /Invalid transaction ID/i.test(error.stack) ||
          /deadlock detected/i.test(error.message) ||
          /deadlock detected/i.test(error.stack) ||
          /could not obtain lock/i.test(error.message) ||
          /canceling statement due to user request/i.test(error.message) ||
          /canceling statement due to user request/i.test(error.stack) ||
          /StatementTimeoutException/i.test(error.message) ||
          /StatementTimeoutException/i.test(error.stack) ||
          error.code === 'StatementTimeoutException' ||
          error.name === 'StatementTimeoutException' ||
          (!!includeRuntimeErrors &&
            (/subquery used as an expression/i.test(error.message) ||
              /subquery used as an expression/i.test(error.stack) ||
              /division by zero/i.test(error.message) ||
              /division by zero/i.test(error.stack))))
      )
    },
  }
)

export default PassthroughError
