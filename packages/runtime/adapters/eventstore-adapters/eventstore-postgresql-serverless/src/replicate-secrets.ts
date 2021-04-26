import { AdapterPool } from './types'
import { OldSecretRecord } from '@resolve-js/eventstore-base'

const replicateSecrets = async (
  pool: AdapterPool,
  existingSecrets: OldSecretRecord[],
  deletedSecrets: Array<OldSecretRecord['id']>
): Promise<void> => {
  const { executeStatement, secretsTableName, escape, escapeId } = pool

  const secretsTableNameAsId = escapeId(secretsTableName)

  if (existingSecrets.length > 0) {
    await executeStatement(
      `INSERT INTO ${secretsTableNameAsId}(
      "id",
      "secret"
    ) VALUES ${existingSecrets
      .map(
        (secretRecord) =>
          `(${escape(secretRecord.id)},${escape(secretRecord.secret)})`
      )
      .join(',')} ON CONFLICT DO NOTHING`
    )
  }
  if (deletedSecrets.length > 0) {
    await executeStatement(`UPDATE ${secretsTableNameAsId} SET "secret" = NULL
      WHERE "id" IN (${deletedSecrets.map((id) => escape(id)).join(',')})`)
  }
}

export default replicateSecrets
