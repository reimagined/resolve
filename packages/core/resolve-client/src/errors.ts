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

export const temporaryErrorHttpCodes: number[] = [
  408, // Request Timeout
  429, // Too Many Requests
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  507, // Insufficient Storage
  509, // Bandwidth Limit Exceeded
  521, // Web Server Is Down
  522, // Connection Timed Out
  523, // Origin Is Unreachable
  524, // A Timeout Occurred
]
