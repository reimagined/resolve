import { SecretsManager } from 'resolve-core'
import { AdapterPool } from './types'

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const { secretsDatabase, secretsTableName } = pool
  const keyRecord = await secretsDatabase.get(
    `SELECT key FROM ${secretsTableName} WHERE id = ?`,
    selector
  )
  return keyRecord ? keyRecord.key : null
}

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const { secretsDatabase, secretsTableName } = pool
  try {
    await secretsDatabase.exec(
      `BEGIN IMMEDIATE;
        INSERT INTO ${secretsTableName}(idx, id, key) VALUES (
          "(SELECT max(idx) + 1 FROM ${secretsTableName})",
          "${selector}",
          "${secret}"
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
  const { secretsDatabase, secretsTableName } = pool
  await secretsDatabase.exec(
    `DELETE FROM ${secretsTableName} WHERE id="${selector}"`
  )
}

const getSecretsManager = (pool: AdapterPool): SecretsManager => {
  return Object.freeze({
    getSecret: getSecret.bind(null, pool),
    setSecret: setSecret.bind(null, pool),
    deleteSecret: deleteSecret.bind(null, pool)
  })
}

export default getSecretsManager
