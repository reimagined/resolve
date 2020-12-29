import getLog from './get-log'
import { AdapterPool } from './types'

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<void> => {
  const log = getLog('secretsManager:deleteSecret')

  log.debug(`removing secret from the database`)
  const {
    databaseName,
    secretsTableName,
    escapeId,
    escape,
    executeStatement,
  } = pool

  // TODO: refactor
  if (
    !secretsTableName ||
    !escapeId ||
    !escape ||
    !databaseName ||
    !executeStatement
  ) {
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)

  const sql = `DELETE FROM ${databaseNameAsId}.${secretsTableNameAsId} 
     WHERE "id"=${escape(selector)}`

  log.debug(`executing SQL query`)

  await executeStatement(sql)

  log.debug(`query executed successfully`)
}

export default deleteSecret
