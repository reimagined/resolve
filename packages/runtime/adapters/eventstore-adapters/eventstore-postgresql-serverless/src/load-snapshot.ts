import { LOAD_CHUNK_SIZE } from './constants'
import { AdapterPool } from './types'

const loadSnapshot = async (
  pool: AdapterPool,
  snapshotKey: string
): Promise<string | null> => {
  const {
    databaseName,
    snapshotsTableName,
    executeStatement,
    escapeId,
    escape,
    isTimeoutError,
  } = pool
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const databaseNameAsId: string = escapeId(databaseName)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)

  let result = null
  for (let index = 0; ; index++) {
    let rows = null

    while (true) {
      try {
        rows = await executeStatement(
          `SELECT substring(
            "snapshotContent" 
            FROM ${index * LOAD_CHUNK_SIZE + 1}
            FOR ${LOAD_CHUNK_SIZE}
          ) AS "SnapshotContentChunk"
          FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
          WHERE "snapshotKey" = ${escape(snapshotKey)} 
          LIMIT 1`
        )
        break
      } catch (err) {
        if (isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

    const content: any = rows.length > 0 ? rows[0].SnapshotContentChunk : null
    if (content == null) {
      break
    } else if (content != null && result == null) {
      result = ''
    }

    result += content

    if (content.length < LOAD_CHUNK_SIZE) {
      break
    }
  }

  return result
}

export default loadSnapshot
