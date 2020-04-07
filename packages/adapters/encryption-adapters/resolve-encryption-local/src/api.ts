import { v4 as uuid4 } from 'uuid'
import { Pool, Client } from 'pg'

type LocalCredentials = {
  user: string
  host: string
  database: string
  password: string
  port: 54320
}

type KeyRecord = {
  id: string
  key: string
}

export type ExecutionResult = Promise<null | KeyRecord[]>

// TODO: get credentials from somewhere
const localCredentials: LocalCredentials = {
  user: 'admin',
  host: 'localhost',
  database: 'testdb',
  password: 'admin',
  port: 54320
}

const pool = new Pool(localCredentials)

const executeStatement = async (pool: Pool, sql: string): ExecutionResult => {
  const errors = []
  let rows = null
  const connection = new Client({
    user: localCredentials.user,
    database: localCredentials.database,
    port: localCredentials.port,
    host: localCredentials.host,
    password: localCredentials.password,
    keepAlive: false,
    // connectionTimeoutMillis: 5000,
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
    error.message = errors.map(({ message }) => message).join('\n')
    error.stack = errors.map(({ stack }) => stack).join('\n')
    throw error
  }

  return rows
}

export const getKey = async (keyId: string): Promise<string | null> => {
  const queryResult = await executeStatement(
    pool,
    `SELECT * FROM public.keys WHERE "id"='${keyId}' LIMIT 1`
  )
  if (queryResult && queryResult.length) {
    return queryResult[0].key
  }

  return null
}

export const insertKey = async (
  keyId: string,
  keyValue: string
): ExecutionResult =>
  executeStatement(
    pool,
    `INSERT INTO public.keys("id", "key") values ('${keyId}', '${keyValue}')`
  )

export const forgetKey = async (keyId: string): ExecutionResult =>
  executeStatement(pool, `DELETE FROM public.keys WHERE "id"='${keyId}'`)

// TODO: generate proper key, not just random sequence
export const generateKey = (): string => uuid4()
