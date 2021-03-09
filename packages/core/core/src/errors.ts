export class CommandError extends Error {
  readonly name: string

  constructor(message: string) {
    super(message)
    this.name = 'CommandError'
  }
}

export class ApiError extends Error {}

export class GenericError extends ApiError {
  constructor(message: string) {
    super(message)
    this.name = 'FetchError'
  }
}

export class HttpError extends ApiError {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'HttpError'
  }
}
export const createHttpError = (code: number, message: string) =>
  new HttpError(code, message)

export const HttpStatusCodes = {
  OK: 200,
  UnprocessableEntity: 422,
  NotFound: 404,
}
