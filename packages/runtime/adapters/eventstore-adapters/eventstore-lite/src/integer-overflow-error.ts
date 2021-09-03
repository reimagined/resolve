function isIntegerOverflowError(errorMessage: string) {
  return (
    errorMessage === 'SQLITE_ERROR: integer overflow' ||
    errorMessage === 'integer overflow'
  )
}

export default isIntegerOverflowError
