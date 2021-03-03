import getLog from './get-log'
import { AdapterPool } from './types'
import { EventstoreFrozenError } from '@resolve-js/eventstore-base'

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret')
  log.debug(`setting secret value within database`)
  const {
    databaseName,
    eventsTableName,
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
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.verbose(`selector: ${selector}`)
  log.verbose(`databaseName: ${databaseName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const databaseNameAsId = escapeId(databaseName)
  const databaseNameAsString = escape(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const freezeTableNameAsString: string = escape(`${eventsTableName}-freeze`)

  // logging of this sql query can lead to security issues
  const sql = `WITH "freeze_check" AS (
              SELECT '' AS "freeze_empty" WHERE (
                (SELECT 1 AS "EventStoreIsFrozen")
              UNION ALL
                (SELECT 1 AS "EventStoreIsFrozen"
                FROM "information_schema"."tables"
                WHERE "table_schema" = ${databaseNameAsString}
                AND "table_name" = ${freezeTableNameAsString})
              ) = 1
            ) INSERT INTO ${databaseNameAsId}.${secretsTableNameAsId}("id", "secret") 
      VALUES (${escape(selector)}, ${escape(secret)} || (
        SELECT "freeze_check"."freeze_empty" from "freeze_check" LIMIT 1
      ))`

  try {
    log.debug(`executing SQL query`)

    await executeStatement(sql)

    log.debug(`query executed successfully`)
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (errorMessage.indexOf('subquery used as an expression') > -1) {
      throw new EventstoreFrozenError()
    } else {
      log.error(error.message)
      log.verbose(error.stack)
    }
    throw error
  }
}

export default setSecret
