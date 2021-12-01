class HttpError extends Error {
  readonly status: number

  constructor(msg: string, httpStatus: number) {
    super(msg)
    this.name = 'HttpError'
    this.status = httpStatus
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export default HttpError
