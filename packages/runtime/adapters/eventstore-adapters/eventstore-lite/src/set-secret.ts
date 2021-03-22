import getLog from './get-log'
import { AdapterPool } from './types'
import { EventstoreFrozenError } from '@resolve-js/eventstore-base'

const setSecret = async (
  {
    database,
    eventsTableName,
    secretsTableName,
    escape,
    escapeId,
  }: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret')
  log.debug(`setting secret value within database`)

  log.verbose(`selector: ${selector}`)
  log.verbose(`database: ${database}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const tableId = escapeId(secretsTableName)
  const freezeTableNameAsString = escape(`${eventsTableName}-freeze`)

  try {
    log.debug(`executing SQL query`)
    await database.exec(
      `BEGIN IMMEDIATE;

      SELECT ABS("CTE"."EventStoreIsFrozen") FROM (
        SELECT 0 AS "EventStoreIsFrozen"
      UNION ALL
        SELECT -9223372036854775808 AS "EventStoreIsFrozen"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${freezeTableNameAsString}
      ) CTE;
      INSERT INTO ${tableId}(
        "idx", 
        "id", 
        "secret"
        ) VALUES (
         COALESCE(
          (SELECT MAX("idx") FROM ${tableId}) + 1,
          0
         ),
         ${escape(selector)},
         ${escape(secret)}
       );
       
       COMMIT;`
    )
    log.debug(`query executed successfully`)
  } catch (error) {
    try {
      await database.exec('ROLLBACK;')
    } catch (e) {}

    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      throw new EventstoreFrozenError()
    } else {
      log.error(error.message)
      log.verbose(error.stack)
      throw error
    }
  }
}

export default setSecret
