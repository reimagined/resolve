const isTimeoutError = error =>
  error != null &&
  (/canceling statement due to user request/i.test(error.message) ||
    /canceling statement due to user request/i.test(error.stack) ||
    /StatementTimeoutException/i.test(error.message) ||
    /StatementTimeoutException/i.test(error.stack) ||
    error.code === 'StatementTimeoutException' ||
    error.name === 'StatementTimeoutException')

export default isTimeoutError
