const isTimeoutError = error =>
  error != null &&
  (/canceling statement due to user request/i.test(error.message) ||
    /StatementTimeoutException/i.test(error.message) ||
    error.code === 'StatementTimeoutException')

export default isTimeoutError
