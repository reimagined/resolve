export class ResourceAlreadyExistError extends Error {
  code: number
  constructor(message: string) {
    super(message)
    this.name = 'ResourceAlreadyExistError'
    this.code = 406
  }
}

export class ResourceNotExistError extends Error {
  code: number
  constructor(message: string) {
    super(message)
    this.name = 'ResourceNotExistError'
    this.code = 410
  }
}
