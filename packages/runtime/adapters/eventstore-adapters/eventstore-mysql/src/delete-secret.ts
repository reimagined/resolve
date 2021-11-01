import { getLog } from './get-log'
import { AdapterPool } from './types'

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<boolean> => {
  const log = getLog('secretsManager:deleteSecret')
  log.debug(`removing secret from the database`)
  const { secretsTableName, escapeId, escape } = pool

  log.verbose(`selector: ${selector}`)
  log.verbose(`tableName: ${secretsTableName}`)

  log.debug(`executing SQL query`)
  await pool.execute(
    `DELETE FROM ${escapeId(secretsTableName)} WHERE \`id\` = ${escape(
      selector
    )}`
  )
  log.debug(`query executed successfully`)
  return true
}

export default deleteSecret
