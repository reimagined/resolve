export class GenericError extends Error {
  protected code: number

  constructor(message = 'Internal Error') {
    super(message)
  }
}

export class BadRequestError extends GenericError {
  constructor(message = 'Bad Request') {
    super(message)
    this.code = 400
  }
}

export class NotFoundError extends GenericError {
  constructor(message = 'Not Found') {
    super(message)
    this.code = 404
  }
}

export class ForbiddenError extends GenericError {
  constructor(message = 'Forbidden') {
    super(message)
    this.code = 403
  }
}

export class UnauthorizedError extends GenericError {
  constructor(message = 'Unauthorized') {
    super(message)
    this.code = 401
  }
}
