const checkFormalError = (error: any, value: string): boolean =>
  error.name === value || error.code === value
const checkFuzzyError = (error: any, value: RegExp): boolean =>
  value.test(error.message) || value.test(error.stack)

// https://www.postgresql.org/docs/10/errcodes-appendix.html
export const isConnectionTerminatedError = (error: any): boolean => {
  return (
    error != null &&
    (checkFuzzyError(error, /Connection terminated/i) ||
      checkFuzzyError(
        error,
        /terminating connection due to serverless scale event timeout/i
      ) ||
      checkFuzzyError(
        error,
        /terminating connection due to administrator command/i
      ) ||
      checkFuzzyError(
        error,
        /Client has encountered a connection error and is not queryable/i
      ) ||
      checkFormalError(error, 'ECONNRESET') ||
      checkFormalError(error, '08000') ||
      checkFormalError(error, '08003') ||
      checkFormalError(error, '08006'))
  )
}

export const isTimeoutError = (error: any): boolean => {
  return (
    error != null &&
    (checkFuzzyError(error, /canceling statement due to statement timeout/i) ||
      checkFuzzyError(error, /Query read timeout/i) ||
      checkFuzzyError(error, /timeout expired/i) ||
      checkFormalError(error, 'ETIMEDOUT'))
  )
}
