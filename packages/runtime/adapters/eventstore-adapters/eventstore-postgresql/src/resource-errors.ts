export function isAlreadyExistsError(error: any): boolean {
  return `${error.code}` === '42P07' || `${error.code}` === '23505'
}

export function isNotExistError(error: any): boolean {
  return `${error.code}` === '42P01'
}
