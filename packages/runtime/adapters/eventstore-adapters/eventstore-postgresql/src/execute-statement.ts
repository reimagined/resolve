import { EOL } from 'os'
import { AdapterPool } from './types'

const executeStatement = async (pool: AdapterPool, sql: any): Promise<any> => {
  const errors: any[] = []
  let rows = null
  const connection = new pool.Postgres({
    keepAlive: false,
    connectionTimeoutMillis: 45000,
    idle_in_transaction_session_timeout: 45000,
    query_timeout: 45000,
    statement_timeout: 45000,
    ...pool.connectionOptions,
  })

  try {
    await connection.connect()
    const result = await connection.query(sql)

    if (result != null && Array.isArray(result.rows)) {
      rows = JSON.parse(JSON.stringify(result.rows))
    }

    return rows
  } catch (error) {
    errors.push(error)
  } finally {
    await connection.end()
  }

  if (errors.length > 0) {
    const error: any = new Error()
    error.message = errors.map(({ message }) => message).join(EOL)
    error.stack = errors.map(({ stack }) => stack).join(EOL)

    const errorCodes = new Set(
      errors.map(({ code }) => code).filter((code) => code != null)
    )
    if (errorCodes.size === 1) {
      error.code = [...errorCodes][0]
    }

    throw error
  }

  return rows
}

export default executeStatement
