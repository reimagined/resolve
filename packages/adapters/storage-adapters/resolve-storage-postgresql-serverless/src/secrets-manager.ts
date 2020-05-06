import getLog from './js/get-log'
import { SecretsManager } from 'resolve-core'
import { AdapterPool } from './types'

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const log = getLog('secretsManager:getSecret')
  log.debug(`retrieving secret value from the database`)

  const { databaseName, secretsTableName, escapeId, executeStatement } = pool

  // TODO: refactor
  if (!secretsTableName || !escapeId || !databaseName || !executeStatement) {
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)

  const sql = `
    SELECT "secret" 
    FROM ${databaseNameAsId}.${secretsTableNameAsId} 
    WHERE "id"='${selector}' LIMIT 1;`

  log.debug(`executing SQL query`)
  log.verbose(sql)

  const rows = await executeStatement(sql)

  log.debug(`query executed, returning result`)

  const { secret } = rows && rows.length ? rows[0] : { secret: null }

  return secret
}

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
    executeStatement
  } = pool

  // TODO: refactor
  if (
    !secretsTableName ||
    !escapeId ||
    !databaseName ||
    !executeStatement ||
    !escape
  ) {
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)

  // logging of this sql query can lead to security issues
  const sql = `INSERT INTO "${databaseNameAsId}"."${secretsTableNameAsId}"("id", "secret") 
    VALUES ('${escape(selector)}', '${escape(secret)}')`

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
    executeStatement
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

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)

  const sql = `DELETE FROM ${databaseNameAsId}.${secretsTableNameAsId} 
     WHERE "id"='${escape(selector)}`

  log.debug(`executing SQL query`)

  await executeStatement(sql)

  log.debug(`query executed successfully`)
}

const getSecretsManager = (pool: AdapterPool): SecretsManager => {
  const log = getLog('getSecretsManager')
  log.debug('building secrets manager')
  const manager = Object.freeze({
    getSecret: getSecret.bind(null, pool),
    setSecret: setSecret.bind(null, pool),
    deleteSecret: deleteSecret.bind(null, pool)
  })
  log.debug('secrets manager built')
  return manager
}

export default getSecretsManager
