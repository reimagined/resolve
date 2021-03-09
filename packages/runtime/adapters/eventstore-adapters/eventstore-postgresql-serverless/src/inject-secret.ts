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
  { id, secret }: SecretRecord
): Promise<void> => {
  const databaseNameAsId = escapeId(databaseName)
  const secretsTableAsId = escapeId(secretsTableName)

  await executeStatement(
    `INSERT INTO ${databaseNameAsId}.${secretsTableAsId}(
      "id",
      "secret"
    ) VALUES(
      ${escape(id)},
      ${escape(secret)}
    )`
  )
}

export default injectSecret
