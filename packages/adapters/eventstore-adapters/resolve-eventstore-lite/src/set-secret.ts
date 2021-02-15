import getLog from './get-log'
import { AdapterPool } from './types'

const setSecret = async (
  { database, secretsTableName, escape, escapeId }: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret')
  log.debug(`setting secret value within database`)

  log.verbose(`selector: ${selector}`)
  log.verbose(`database: ${database}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const tableId = escapeId(secretsTableName)

  try {
    log.debug(`executing SQL query`)
    await database.exec(
      `INSERT INTO ${tableId}(
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
       )`
    )
    log.debug(`query executed successfully`)
  } catch (error) {
    log.error(error.message)
    log.verbose(error.stack)
    throw error
  }
}

export default setSecret
