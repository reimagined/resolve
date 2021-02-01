import getLog from './get-log'
import { AdapterPool } from './types'

const deleteSecret = async (
  { database, secretsTableName, escapeId }: AdapterPool,
  selector: string
): Promise<void> => {
  const log = getLog('secretsManager:deleteSecret')
  log.debug(`removing secret from the database`)

  log.verbose(`selector: ${selector}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  log.debug(`executing SQL query`)
  await database.exec(
    `DELETE FROM ${escapeId(secretsTableName)} WHERE id="${selector}"`
  )
  log.debug(`query executed successfully`)
}

export default deleteSecret
