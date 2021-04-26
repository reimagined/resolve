import {
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const loadSecrets = async (
  { database, escapeId, escape, secretsTableName }: AdapterPool,
  filter: SecretFilter
): Promise<SecretsWithIdx> => {
  const { idx, limit, skip } = filter

  const tableNameAsId: string = escapeId(secretsTableName)
  const searchIdx: number = idx == null ? 0 : idx
  const skipRows = skip === undefined ? 0 : skip

  const rows = await database.all(
    `SELECT idx, id, secret FROM ${tableNameAsId}
    WHERE secret IS NOT NULL AND idx >= ${+searchIdx}
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
