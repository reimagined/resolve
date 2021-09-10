import {
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const loadSecrets = async (
  { executeStatement, escapeId, escape, secretsTableName }: AdapterPool,
  filter: SecretFilter
): Promise<SecretsWithIdx> => {
  const { idx, limit, skip, ids, includeDeleted } = filter

  const tableNameAsId: string = escapeId(secretsTableName)
  const searchIdx: number = idx == null ? 0 : idx
  const skipRows = skip === undefined ? 0 : skip

  if (ids && ids.length === 0) {
    return {
      secrets: [],
      idx: searchIdx,
    }
  }

  const rows = await executeStatement(
    `SELECT idx, id, secret FROM ${tableNameAsId}
    WHERE ${
      !includeDeleted ? `"secret" IS NOT NULL AND` : ''
    } idx >= ${+searchIdx}
    ${ids ? `AND id IN (${ids.map((id) => escape(id)).join(',')})` : ''}
    ORDER BY "idx" ASC
    LIMIT ${+limit} OFFSET ${skipRows}`
  )

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
