class PassthroughError extends Error {
  constructor(lastTransactionId) {
    super()
    this.name = 'PassthroughError'
    this.lastTransactionId = lastTransactionId
  }

  static isPassthroughError(error) {
    return (
      error != null &&
      (/Transaction .*? Is Not Found/i.test(error.message) ||
        /deadlock detected/i.test(error.message) ||
        /could not obtain lock/i.test(error.message))
    )
  }
}

export default PassthroughError
