export const httpCodeInternalServerError = 500
export const httpMinimumCode = 100
export const httpMaximumCode = 599

const extractErrorHttpCode = (error) => {
  if (!(error instanceof Error) || !error.hasOwnProperty('code')) {
    return httpCodeInternalServerError
  }

  const code = error.code
  if (
    !Number.isInteger(code) ||
    code < httpMinimumCode ||
    code > httpMaximumCode
  ) {
    return httpCodeInternalServerError
  }

  return code
}

export default extractErrorHttpCode
