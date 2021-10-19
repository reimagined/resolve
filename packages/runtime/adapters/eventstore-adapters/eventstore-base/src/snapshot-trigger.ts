import { getLog } from './get-log'
import { AdapterPoolConnectedProps, AdapterPoolConnected } from './types'

const snapshotTrigger = async <
  ConnectedProps extends AdapterPoolConnectedProps
>(
  state: AdapterPoolConnected<ConnectedProps>,
  snapshotKey: string,
  content: string,
  updateCallback: any
): Promise<any> => {
  const log = getLog(`snapshotTrigger`)
  const { bucketSize, counters } = state

  log.verbose(`snapshotKey: ${snapshotKey}`)
  log.verbose(`bucketSize: ${bucketSize}`)

  if (snapshotKey == null || snapshotKey.constructor !== String) {
    const error = new Error('Snapshot key must be a string')
    log.error(error.message)
    throw error
  }
  if (content == null || content.constructor !== String) {
    const error = new Error('Snapshot content must be a string')
    log.error(error.message)
    throw error
  }

  const snapshotIndex = counters.get(snapshotKey)
  if (snapshotIndex === undefined) {
    counters.set(snapshotKey, 1)
  } else {
    counters.set(snapshotKey, snapshotIndex + 1)
  }

  const pendingSnapshotIndex = counters.get(snapshotKey)
  if (pendingSnapshotIndex !== undefined && pendingSnapshotIndex < bucketSize) {
    log.verbose(
      `pending snapshot: (${counters.get(snapshotKey)}/${bucketSize})`
    )
    return Promise.resolve()
  }
  counters.set(snapshotKey, 0)
  log.debug(`updating snapshot ${snapshotKey}`)
  return updateCallback()
}

export default snapshotTrigger
