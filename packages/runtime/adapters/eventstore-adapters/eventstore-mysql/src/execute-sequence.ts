import type { AdapterPool } from './types'

const executeSequence = async (
  pool: AdapterPool,
  statements: string[],
  log: any,
  convertToKnownError: (error: any) => any
): Promise<any[]> => {
  const errors: any[] = []

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await pool.execute(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error != null) {
        let errorToThrow = error
        const knownError = convertToKnownError(error)
        if (knownError != null) {
          errorToThrow = knownError
        } else {
          log.error(errorToThrow.message)
          log.verbose(errorToThrow.stack)
        }
        errors.push(errorToThrow)
      }
    }
  }

  return errors
}

export default executeSequence
