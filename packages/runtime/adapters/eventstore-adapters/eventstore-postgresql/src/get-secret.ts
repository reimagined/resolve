import { getLog } from './get-log'
import { AdapterPool } from './types'

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const log = getLog('secretsManager:getSecret')
  log.debug(`retrieving secret value from the database`)

  const {
    databaseName,
    secretsTableName,
    escapeId,
    executeStatement,
    escape,
  } = pool

  // TODO: refactor
  if (
    !secretsTableName ||
    !escapeId ||
    !databaseName ||
    !executeStatement ||
    !escape
  ) {
    const error: Error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)

  const sql = `
    SELECT "secret" 
    FROM ${databaseNameAsId}.${secretsTableNameAsId} 
    WHERE "id"=${escape(selector)} AND "secret" IS NOT NULL LIMIT 1;`

  log.debug(`executing SQL query`)
  log.verbose(sql)

  const rows = await executeStatement(sql)

  log.debug(`query executed, returning result`)

  const { secret } = rows && rows.length ? rows[0] : { secret: null }

  return secret
}

export default getSecret
