import { AdapterPool } from './types'

const checkFormalError = (error: any, value: string): boolean =>
  error.name === value || error.code === value
const checkFuzzyError = (error: any, value: RegExp): boolean =>
  value.test(error.message) || value.test(error.stack)
// https://www.postgresql.org/docs/10/errcodes-appendix.html
const isRetryableError = (error: any): boolean =>
  error != null &&
  (checkFuzzyError(
    error,
    /terminating connection due to serverless scale event timeout/i
  ) ||
    checkFuzzyError(error, /Remaining connection slots are reserved/i) ||
    checkFuzzyError(error, /Too many clients already/i) ||
    checkFormalError(error, 'ECONNRESET') ||
    checkFormalError(error, '08000') ||
    checkFormalError(error, '08003') ||
    checkFormalError(error, '08006') ||
    checkFuzzyError(error, /Connection terminated/i) ||
    checkFuzzyError(error, /Query read timeout/i))

const executeStatement = async (pool: AdapterPool, sql: any): Promise<any> => {
  while (true) {
    try {
      if (pool.connectionErrors.length > 0) {
        let summaryError = pool.connectionErrors[0]
        if (pool.connectionErrors.length > 1) {
          summaryError = new Error(
            pool.connectionErrors.map(({ message }) => message).join('\n')
          )
          summaryError.stack = pool.connectionErrors
            .map(({ stack }) => stack)
            .join('\n')
        }
        pool.connectionErrors = []
        throw summaryError
      }

      const result = await pool.connection.query(sql)

      if (result != null && Array.isArray(result.rows)) {
        return JSON.parse(JSON.stringify(result.rows))
      }

      return null
    } catch (error) {
      if (isRetryableError(error)) {
        try {
          await pool.connection.end()
        } catch (error) {
          // pass
        }

        pool.getConnectPromise = pool.createGetConnectPromise()
        await pool.getConnectPromise()
      } else {
        throw error
      }
    }
  }
}

export default executeStatement
