class PassthroughError extends Error {
  constructor(lastTransactionId) {
    super()
    this.name = 'PassthroughError'
    this.lastTransactionId = lastTransactionId
  }

  static isPassthroughError(error, includeRuntimeErrors = false) {
    return (
      error != null &&
      (/Transaction .*? Is Not Found/i.test(error.message) ||
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
  }
}

export default PassthroughError
