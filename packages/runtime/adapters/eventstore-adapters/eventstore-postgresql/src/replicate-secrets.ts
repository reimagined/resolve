import type { AdapterPool } from './types'
import type { OldSecretRecord } from '@resolve-js/eventstore-base'

const replicateSecrets = async (
  pool: AdapterPool,
  lockId: string,
  existingSecrets: OldSecretRecord[],
  deletedSecrets: Array<OldSecretRecord['id']>
): Promise<boolean> => {
  const {
    executeStatement,
    eventsTableName,
    secretsTableName,
    escape,
    escapeId,
    databaseName,
  } = pool

  const secretsTableNameAsId = escapeId(secretsTableName)
  const databaseNameAsId = escapeId(databaseName)
  const replicationStateTableNameAsId = escapeId(
    `${eventsTableName}-replication-state`
  )

  if (existingSecrets.length > 0 || deletedSecrets.length > 0) {
    try {
      await executeStatement(
        `BEGIN WORK;
      LOCK TABLE ${databaseNameAsId}.${replicationStateTableNameAsId} IN EXCLUSIVE MODE NOWAIT;
      SELECT 0 AS "lock_zero" WHERE (
        (SELECT 1 AS "ReplicationIsLocked")
      UNION ALL
        (SELECT 1 AS "ReplicationIsLocked"
        FROM ${databaseNameAsId}.${replicationStateTableNameAsId}
        WHERE "LockId" != ${escape(lockId)})
      ) = 1;
      ${
        existingSecrets.length > 0
          ? `INSERT INTO ${databaseNameAsId}.${secretsTableNameAsId}(
      "id",
      "secret"
    ) VALUES ${existingSecrets
      .map(
        (secretRecord) =>
          `(${escape(secretRecord.id)},${
            secretRecord.secret != null ? escape(secretRecord.secret) : 'NULL'
          })`
      )
      .join(',')} ON CONFLICT DO NOTHING;`
          : ''
      }
      ${
        deletedSecrets.length > 0
          ? `UPDATE ${databaseNameAsId}.${secretsTableNameAsId} SET "secret" = NULL
      WHERE "id" IN (${deletedSecrets.map((id) => escape(id)).join(',')});`
          : ''
      }
      COMMIT WORK;`
      )
    } catch (error) {
      try {
        await executeStatement('ROLLBACK;')
      } catch (rollbackError) {
        // ignore
      }

      const errorMessage =
        error != null && error.message != null ? error.message : ''
      if (errorMessage.indexOf('subquery used as an expression') > -1) {
        return false
      } else if (
        errorMessage.indexOf('could not obtain lock on relation') > -1
      ) {
        return false
      } else {
        throw error
      }
    }
  }
  return true
}

export default replicateSecrets
