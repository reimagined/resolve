import getLog from './get-log'
import { AdapterPool } from './types'

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<void> => {
  const log = getLog('secretsManager:deleteSecret')
  log.debug(`removing secret from the database`)
  const { secretsTableName, connection, escapeId, escape } = pool

  log.verbose(`selector: ${selector}`)
  log.verbose(`tableName: ${secretsTableName}`)

  log.debug(`executing SQL query`)
  await connection.execute(
    `DELETE FROM ${escapeId(secretsTableName)} WHERE \`id\` = ${escape(
      selector
    )}`
  )
  log.debug(`query executed successfully`)
}

export default deleteSecret
