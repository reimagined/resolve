export function isAlreadyExistsError(message: string): boolean {
  return (
    /Relation.*? already exists$/i.test(message) ||
    /duplicate key value violates unique constraint/i.test(message)
  )
}

export function isNotExistError(message: string): boolean {
  return /Table.*? does not exist$/i.test(message)
}
