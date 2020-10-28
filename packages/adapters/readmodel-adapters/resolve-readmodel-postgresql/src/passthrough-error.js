class PassthroughError extends Error {
  constructor() {
    super()
    this.name = 'PassthroughError'
  }

  // https://www.postgresql.org/docs/10/errcodes-appendix.html
  static get DIVISION_BY_ZERO() {
    return '22012'
  }
  static get CARDINALITY_VIOLATION() {
    return '21000'
  }
  static get IN_FAILED_SQL_TRANSACTION() {
    return '25P02'
  }
  static get LOCK_NOT_AVAILABLE() {
    return '55P03'
  }
  static get DEADLOCK_DETECTED() {
    return '40P01'
  }

  static isPassthroughError(error, includeRuntimeErrors = false) {
    return (
      error != null &&
      error.code != null &&
      (`${error.code}` === PassthroughError.IN_FAILED_SQL_TRANSACTION ||
        `${error.code}` === PassthroughError.LOCK_NOT_AVAILABLE ||
        `${error.code}` === PassthroughError.DEADLOCK_DETECTED ||
        (!!includeRuntimeErrors &&
          (`${error.code}` === PassthroughError.CARDINALITY_VIOLATION ||
            `${error.code}` === PassthroughError.DIVISION_BY_ZERO)))
    )
  }
}

export default PassthroughError
