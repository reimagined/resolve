import getLog from 'resolve-debug-levels'
import { SecretsManager } from 'resolve-core'
import { AdapterPool } from './types'
import logNamespace from './log-namespace'

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const { secretsDatabase, secretsTableName, escapeId } = pool
  const keyRecord = await secretsDatabase.get(
    `SELECT key FROM ${escapeId(secretsTableName)} WHERE id = ?`,
    selector
  )
  return keyRecord ? keyRecord.key : null
}

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const { secretsDatabase, secretsTableName, escape, escapeId } = pool
  try {
    await secretsDatabase.exec(
      `BEGIN IMMEDIATE;
        INSERT INTO ${escapeId(secretsTableName)}(idx, id, key) VALUES (
          "(SELECT max(idx) + 1 FROM ${escapeId(secretsTableName)})",
          "${escape(selector)}",
          "${escape(secret)}"
        );
        COMMIT;`
    )
  } catch (error) {
    try {
      await secretsDatabase.exec('ROLLBACK;')
    } catch (e) {}

    throw error
  }
}

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<void> => {
  const { secretsDatabase, secretsTableName, escapeId } = pool
  await secretsDatabase.exec(
    `DELETE FROM ${escapeId(secretsTableName)} WHERE id="${selector}"`
  )
}

const getSecretsManager = (pool: AdapterPool): SecretsManager => {
  const log = getLog(logNamespace('getSecretsManager'))
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
