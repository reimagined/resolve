class PassthroughError extends Error {
  constructor() {
    super()
    this.name = 'PassthroughError'
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
