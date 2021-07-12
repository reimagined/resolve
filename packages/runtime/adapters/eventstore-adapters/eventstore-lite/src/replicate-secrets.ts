import type { AdapterPool } from './types'
import type { OldSecretRecord } from '@resolve-js/eventstore-base'

const replicateSecrets = async (
  pool: AdapterPool,
  existingSecrets: OldSecretRecord[],
  deletedSecrets: Array<OldSecretRecord['id']>
): Promise<void> => {
  const { database, secretsTableName, escape, escapeId } = pool

  const secretsTableNameAsId = escapeId(secretsTableName)

  if (existingSecrets.length > 0) {
    await database.exec(
      `INSERT OR IGNORE INTO ${secretsTableNameAsId}(
      "idx",
      "id",
      "secret"
    ) VALUES ${existingSecrets
      .map(
        (secretRecord) =>
          `(${secretRecord.idx},${escape(secretRecord.id)},${
            secretRecord.secret != null ? escape(secretRecord.secret) : 'NULL'
          })`
      )
      .join(',')}`
    )
  }
  if (deletedSecrets.length > 0) {
    await database.exec(`UPDATE ${secretsTableNameAsId} SET "secret" = NULL
      WHERE "id" IN (${deletedSecrets.map((id) => escape(id)).join(',')})`)
  }
}

export default replicateSecrets
