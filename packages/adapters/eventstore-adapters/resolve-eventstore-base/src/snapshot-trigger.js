import getLog from './get-log'

export default async (state, snapshotKey, content, updateCallback) => {
  const log = getLog(`snapshotTrigger`)
  const { bucketSize, counters } = state

  log.verbose(`snapshotKey: ${snapshotKey}`)
  log.verbose(`bucketSize: ${bucketSize}`)

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
    counters.set(snapshotKey, 1)
  } else {
    counters.set(snapshotKey, counters.get(snapshotKey) + 1)
  }

  if (counters.get(snapshotKey) < bucketSize) {
    log.verbose(
      `pending snapshot: (${counters.get(snapshotKey)}/${bucketSize})`
    )
    return Promise.resolve()
  }
  counters.set(snapshotKey, 0)
  log.debug(`updating snapshot ${snapshotKey}`)
  return updateCallback()
}
