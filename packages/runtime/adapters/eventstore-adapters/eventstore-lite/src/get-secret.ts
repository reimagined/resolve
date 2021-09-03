import { getLog } from './get-log'
import { AdapterPool } from './types'

const getSecret = async (
  {
    executeStatement,
    databaseFile,
    secretsTableName,
    escapeId,
    escape,
  }: AdapterPool,
  selector: string
): Promise<string | null> => {
  const log = getLog('secretsManager:getSecret')
  log.debug(`retrieving secret value from the database`)

  log.verbose(`selector: ${selector}`)
  log.verbose(`database: ${databaseFile}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  log.debug(`executing SQL query`)
  const rows = await executeStatement(
    `SELECT "secret" FROM ${escapeId(secretsTableName)}
    WHERE id = ${escape(selector)} AND secret IS NOT NULL
    LIMIT 0, 1`
  )

  log.debug(`query executed, returning result`)

  if (rows.length !== 1) {
    return null
  }

  return rows[0].secret
}

export default getSecret
