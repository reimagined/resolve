import type { AdapterPool } from './types'
import type { OldSecretRecord } from '@resolve-js/eventstore-base'

const replicateSecrets = async (
  pool: AdapterPool,
  existingSecrets: OldSecretRecord[],
  deletedSecrets: Array<OldSecretRecord['id']>
): Promise<void> => {
  const {
    executeStatement,
    secretsTableName,
    escape,
    escapeId,
    databaseName,
  } = pool

  const secretsTableNameAsId = escapeId(secretsTableName)
  const databaseNameAsId = escapeId(databaseName)

  if (existingSecrets.length > 0) {
    await executeStatement(
      `INSERT INTO ${databaseNameAsId}.${secretsTableNameAsId}(
      "id",
      "secret"
    ) VALUES ${existingSecrets
      .map(
        (secretRecord) =>
          `(${escape(secretRecord.id)},${
            secretRecord.secret != null ? escape(secretRecord.secret) : 'NULL'
          })`
      )
      .join(',')} ON CONFLICT DO NOTHING`
    )
  }
  if (deletedSecrets.length > 0) {
    await executeStatement(`UPDATE ${databaseNameAsId}.${secretsTableNameAsId} SET "secret" = NULL
      WHERE "id" IN (${deletedSecrets.map((id) => escape(id)).join(',')})`)
  }
}

export default replicateSecrets
