class PassthroughError extends Error {
  constructor() {
    super()
    this.name = 'PassthroughError'
  }

  // https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html
  static get ER_SUBQUERY_NO_1_ROW() {
    return 1242
  }
  static get ER_DIVISION_BY_ZERO() {
    return 1365
  }
  static get ER_LOCK_DEADLOCK() {
    return 1213
  }
  static get ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION() {
    return 1792
  }
  static get ER_LOCK_OR_ACTIVE_TRANSACTION() {
    return 1192
  }
  static get ER_TOO_MANY_CONCURRENT_TRXS() {
    return 1637
  }
  static get ER_LOCK_WAIT_TIMEOUT() {
    return 1205
  }
  static get ER_LOCK_NOWAIT() {
    return 3572
  }
  static get ER_CON_COUNT_ERROR() {
    return 1040
  }

  static isPassthroughError(error, includeRuntimeErrors = false) {
    return (
      error != null &&
      error.errno != null &&
      (error.errno === PassthroughError.ER_CON_COUNT_ERROR ||
        error.errno === PassthroughError.ER_LOCK_DEADLOCK ||
        error.errno === PassthroughError.ER_LOCK_NOWAIT ||
        error.errno ===
          PassthroughError.ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION ||
        error.errno === PassthroughError.ER_LOCK_OR_ACTIVE_TRANSACTION ||
        error.errno === PassthroughError.ER_TOO_MANY_CONCURRENT_TRXS ||
        error.errno === PassthroughError.ER_LOCK_WAIT_TIMEOUT ||
        (!!includeRuntimeErrors &&
          (error.errno === PassthroughError.ER_SUBQUERY_NO_1_ROW ||
            error.errno === PassthroughError.ER_DIVISION_BY_ZERO)))
    )
  }
}

export default PassthroughError
