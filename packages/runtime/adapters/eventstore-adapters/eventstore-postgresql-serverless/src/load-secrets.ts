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
  const { idx, limit, skip, ids } = filter

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const searchIdx: number = idx == null ? 0 : idx
  const skipRows = skip === undefined ? 0 : skip

  const sql = `
    SELECT idx, id, secret FROM ${databaseNameAsId}.${secretsTableNameAsId}
    WHERE secret IS NOT NULL AND idx >= ${+searchIdx}
    ${ids ? `AND id IN (${ids.map((id) => escape(id)).join(',')})` : ''}
    ORDER BY "idx" ASC
    LIMIT ${+limit} OFFSET ${skipRows}`

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
