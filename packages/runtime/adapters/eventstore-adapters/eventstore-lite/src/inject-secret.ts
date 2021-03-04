import { SecretRecord } from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const injectSecret = async (
  { database, escapeId, escape, secretsTableName }: AdapterPool,
  { idx, id, secret }: SecretRecord
): Promise<void> => {
  const tableNameAsId: string = escapeId(secretsTableName)

  await database.exec(
    `INSERT INTO ${tableNameAsId}(
      "idx",
      "id",
      "secret"
    ) VALUES(
      ${+idx},
      ${escape(id)},
      ${escape(secret)}
    )`
  )
}

export default injectSecret
