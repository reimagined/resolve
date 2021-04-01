import { SecretRecord } from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const injectSecret = async (
  {
    databaseName,
    escapeId,
    escape,
    secretsTableName,
    executeStatement,
  }: AdapterPool,
  { id, secret, idx }: SecretRecord
): Promise<void> => {
  const databaseNameAsId = escapeId(databaseName)
  const secretsTableAsId = escapeId(secretsTableName)

  await executeStatement(
    `INSERT INTO ${databaseNameAsId}.${secretsTableAsId}(
      "id",
      "secret",
      "idx"
    ) VALUES(
      ${escape(id)},
      ${escape(secret)},
      ${idx}
    )`
  )
}

export default injectSecret
