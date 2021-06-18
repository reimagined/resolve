export class GenericError extends Error {
  constructor(message = 'Internal Error') {
    super(message)
  }
}

export class HttpError extends GenericError {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request') {
    super(400, message)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message)
  }
}
