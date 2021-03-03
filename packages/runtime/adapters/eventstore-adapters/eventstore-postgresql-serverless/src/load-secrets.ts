import {
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const loadSecrets = async (
  {
    databaseName,
    escapeId,
    escape,
    secretsTableName,
    executeStatement,
  }: AdapterPool,
  filter: SecretFilter
): Promise<SecretsWithIdx> => {
  const { idx, limit } = filter

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const searchIdx: number = idx == null ? 0 : idx

  const sql = `
    SELECT idx, id, secret FROM ${databaseNameAsId}.${secretsTableNameAsId}
    WHERE idx >= ${+searchIdx}
    ORDER BY "idx" ASC
    LIMIT ${+limit}`

  const rows = await executeStatement(sql)

  const secrets: SecretRecord[] = []
  for (const secret of rows) {
    secrets.push({
      secret: secret.secret,
      id: secret.id,
      idx: secret.idx,
    })
  }

  return {
    secrets: secrets,
    idx: secrets.length ? secrets[secrets.length - 1].idx + 1 : null,
  }
}

export default loadSecrets
