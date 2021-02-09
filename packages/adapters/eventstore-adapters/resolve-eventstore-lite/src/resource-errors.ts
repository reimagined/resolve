export function isAlreadyExistsError(message: string): boolean {
  return /(?:Table|Index).*? already exists$/i.test(message)
}

export function isNotExistError(message: string): boolean {
  return /^SQLITE_ERROR: no such (?:table|(?:Table|Index)).*?$/.test(message)
}
