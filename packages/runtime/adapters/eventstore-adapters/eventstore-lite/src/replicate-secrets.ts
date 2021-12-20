import type { AdapterPool } from './types'
import type { OldSecretRecord } from '@resolve-js/eventstore-base'
import isIntegerOverflowError from './integer-overflow-error'

const replicateSecrets = async (
  pool: AdapterPool,
  lockId: string,
  existingSecrets: OldSecretRecord[],
  deletedSecrets: Array<OldSecretRecord['id']>
): Promise<boolean> => {
  const {
    executeQuery,
    secretsTableName,
    eventsTableName,
    escape,
    escapeId,
  } = pool

  const replicationStateTableNameAsId = escapeId(
    `${eventsTableName}-replication-state`
  )
  const secretsTableNameAsId = escapeId(secretsTableName)

  if (existingSecrets.length > 0 || deletedSecrets.length > 0) {
    try {
      await executeQuery(
        `
      BEGIN IMMEDIATE;
      SELECT ABS("ReplicationIsLocked") AS "lock_zero" FROM (
        SELECT 0 AS "ReplicationIsLocked"
      UNION ALL
        SELECT -9223372036854775808 AS "ReplicationIsLocked"
        FROM ${replicationStateTableNameAsId}
        WHERE "LockId" != ${escape(lockId)} 
      );
      ${
        existingSecrets.length > 0
          ? `INSERT OR IGNORE INTO ${secretsTableNameAsId}(
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
      .join(',')};`
          : ``
      }
      ${
        deletedSecrets.length > 0
          ? `UPDATE ${secretsTableNameAsId} SET "secret" = NULL
      WHERE "id" IN (${deletedSecrets.map((id) => escape(id)).join(',')});`
          : ``
      }
      COMMIT;`
      )
    } catch (error) {
      try {
        await executeQuery('ROLLBACK;')
      } catch (rollbackError) {
        // ignore
      }

      const errorMessage =
        error != null && error.message != null ? error.message : ''

      const errorCode =
        error != null && error.code != null ? (error.code as string) : ''

      if (errorCode === 'SQLITE_BUSY') {
        return false
      } else if (isIntegerOverflowError(errorMessage)) {
        return false
      } else {
        throw error
      }
    }
  }
  return true
}

export default replicateSecrets
