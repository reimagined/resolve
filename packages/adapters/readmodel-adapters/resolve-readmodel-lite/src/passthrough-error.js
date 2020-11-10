class PassthroughError extends Error {
  constructor() {
    super()
    this.name = 'PassthroughError'
  }

  static isPassthroughError(error) {
    return (
      error != null &&
      (/cannot rollback - no transaction is active/i.test(error.message) ||
        error.code === 'SQLITE_ABORT' ||
        error.code === 'SQLITE_BUSY' ||
        error.code === 'SQLITE_READONLY' ||
        error.code === 'SQLITE_INTERRUPT' ||
        error.code === 'SQLITE_LOCKED')
    )
  }
}

export default PassthroughError
