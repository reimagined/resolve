import getLog from './get-log'

const saveSnapshot = async (pool, snapshotKey, content) => {
  const log = getLog(`saveSnapshot`)
  const {
    bucketSize,
    escape,
    escapeId,
    counters,
    database,
    snapshotsTableName
  } = pool

  log.verbose(`snapshotKey: ${snapshotKey}`)
  log.verbose(`bucketSize: ${bucketSize}`)
  log.verbose(`snapshotsTableName: ${snapshotsTableName}`)
  log.verbose(`counters.size: ${counters.size}`)

  if (snapshotKey == null || snapshotKey.constructor !== String) {
    const error = new Error('Snapshot key must be string')
    log.error(error.message)
    throw error
  }
  if (content == null || content.constructor !== String) {
    const error = new Error('Snapshot content must be string')
    log.error(error.message)
    throw error
  }

  if (!counters.has(snapshotKey)) {
    counters.set(snapshotKey, 0)
  }

  if (counters.get(snapshotKey) < bucketSize) {
    log.debug(
      `skipping actual snapshot saving - not enough events to fill the bucket`
    )
    counters.set(snapshotKey, counters.get(snapshotKey) + 1)
    return
  }
  counters.set(snapshotKey, 0)

  log.debug(`saving snapshot ${snapshotKey}`)

  await database.exec(
    `INSERT INTO ${escapeId(snapshotsTableName)} 
    VALUES (${escape(snapshotKey)}, ${escape(content)})`
  )
}

export default saveSnapshot
