import getLog from './get-log'
import { AdapterPool } from './types'

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret')
  log.debug(`setting secret value within database`)
  const {
    databaseName,
    secretsTableName,
    escape,
    escapeId,
    executeStatement,
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

  // logging of this sql query can lead to security issues
  const sql = `INSERT INTO ${databaseNameAsId}.${secretsTableNameAsId}("id", "secret") 
    VALUES (${escape(selector)}, ${escape(secret)})`

  try {
    log.debug(`executing SQL query`)

    await executeStatement(sql)

    log.debug(`query executed successfully`)
  } catch (error) {
    log.error(error.message)
    log.verbose(error.stack)
    throw error
  }
}

export default setSecret
