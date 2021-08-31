import { SecretRecord } from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const injectSecret = async (
  { executeQuery, escapeId, escape, secretsTableName }: AdapterPool,
  { idx, id, secret }: SecretRecord
): Promise<void> => {
  const tableNameAsId: string = escapeId(secretsTableName)

  await executeQuery(
    `INSERT INTO ${tableNameAsId}(
      "idx",
      "id",
      "secret"
    ) VALUES(
      ${+idx},
      ${escape(id)},
      ${secret != null ? escape(secret) : 'NULL'}
    )`
  )
}

export default injectSecret
