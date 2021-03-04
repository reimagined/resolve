export function isAlreadyExistsError(error: any): boolean {
  return `${error.code}` === '42P07'
}

export function isNotExistError(error: any): boolean {
  return `${error.code}` === '42P01'
}
