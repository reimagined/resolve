import { EOL } from 'os'

const executeStatement = async (pool, sql) => {
  const errors = []
  let rows = null
  const connection = new pool.Postgres({
    user: pool.config.user,
    database: pool.config.database,
    port: pool.config.port,
    host: pool.config.host,
    password: pool.config.password,
    keepAlive: false,
    connectionTimeoutMillis: 5000,
    idle_in_transaction_session_timeout: 5000,
    query_timeout: 5000,
    statement_timeout: 5000
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
    const error = new Error()
    error.message = errors.map(({ message }) => message).join(EOL)
    error.stack = errors.map(({ stack }) => stack).join(EOL)
    throw error
  }

  return rows
}

export default executeStatement
