import { getLog } from './get-log'
import { AdapterPool } from './types'

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const log = getLog('secretsManager:getSecret')
  log.debug(`retrieving secret value from the database`)

  const { connection, secretsTableName, escape, escapeId } = pool

  log.verbose(`selector: ${selector}`)
  log.verbose(`tableName: ${secretsTableName}`)

  const sql = `SELECT \`secret\` FROM ${escapeId(
    secretsTableName
  )} WHERE id = ${escape(selector)}`

  log.verbose(sql)

  log.debug(`executing SQL query`)
  const [rows] = await connection.query(sql)

  log.debug(`query executed, returning result`)

  const { secret } = rows && rows.length ? rows[0] : { secret: null }

  return secret
}

export default getSecret
