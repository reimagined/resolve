class PassthroughError extends Error {
  constructor(isRuntimeError) {
    super()
    this.isRuntimeError = !!isRuntimeError
    this.name = 'PassthroughError'
  }

  static isPassthroughError(error, includeRuntimeErrors = false) {
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
}

export default PassthroughError
