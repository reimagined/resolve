export function isAlreadyExistsError(message: string): boolean {
  return /(?:Table|Index).*? already exists$/i.test(message)
}

export function isNotExistError(message: string): boolean {
  return /^no such (?:table|(?:Table|Index)).*?$/.test(message)
}
