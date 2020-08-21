import getLog from './get-log'
import createAdapter from './create-adapter'
import importStream from './import'
import exportStream from './export'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapSaveEvent from './wrap-save-event'
import wrapDispose from './wrap-dispose'
import wrapStream from './wrap-stream'
import loadEvents from './load-events'
import { DEFAULT_SNAPSHOT_BUCKET_SIZE } from './constants'
import incrementalImport from './incremental-import'
import {
  AdapterImplementation,
  AdapterState,
  Status,
  IAdapter,
  IAdapterOptions,
  IEventFromDatabase
} from './types'

function createAdapter<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  implementation: AdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >,
  options: AdapterOptions
): IAdapter {
  const {
    getConfig,
    getLatestEvent,
    saveEvent,
    init,
    drop,
    dispose,
    isFrozen,
    freeze,
    unfreeze,
    loadSnapshot,
    saveSnapshot,
    dropSnapshot,
    getSecret,
    setSecret,
    deleteSecret,
    beginIncrementalImport,
    commitIncrementalImport,
    rollbackIncrementalImport,
    pushIncrementalImport
  } = implementation

  const log = getLog(`createAdapter`)

  let bucketSize = DEFAULT_SNAPSHOT_BUCKET_SIZE
  const { snapshotBucketSize } = options
  if (snapshotBucketSize != null && Number.isSafeInteger(snapshotBucketSize) && snapshotBucketSize > 0) {
    bucketSize = snapshotBucketSize
    log.debug(`snapshot bucket size explicitly set to ${bucketSize}`)
  } else {
    log.debug(
      `snapshot bucket size defaulted to ${DEFAULT_SNAPSHOT_BUCKET_SIZE}`
    )
  }

  const state: AdapterState<AdapterConnection, AdapterOptions> = {
    connection: null,
    status: Status.NOT_CONNECTED,
    config: getConfig(options),
    snapshotBucketSize
  }

  const adapter = {
    loadEvents: wrapMethod(state, implementation, wrapEventFilter(loadEvents)),
    import: wrapStream(state, implementation, importStream),
    export: wrapStream(state, implementation, exportStream),
    getLatestEvent: wrapMethod(state, implementation, getLatestEvent),
    saveEvent: wrapSaveEvent(state, implementation, saveEvent),
    init: wrapMethod(state, implementation, init),
    drop: wrapMethod(state, implementation, drop),
    dispose: wrapDispose(state, implementation, dispose),
    isFrozen: wrapMethod(state, implementation, isFrozen),
    freeze: wrapMethod(state, implementation, freeze),
    unfreeze: wrapMethod(state, implementation, unfreeze),
    loadSnapshot: wrapMethod(state, implementation, loadSnapshot),
    saveSnapshot: wrapMethod(state, implementation, saveSnapshot),
    dropSnapshot: wrapMethod(state, implementation, dropSnapshot),
    getSecret: wrapMethod(state, implementation, getSecret),
    setSecret: wrapMethod(state, implementation, setSecret),
    deleteSecret: wrapMethod(state, implementation, deleteSecret),
    pushIncrementalImport: wrapMethod(
      state,
      implementation,
      pushIncrementalImport
    ),
    beginIncrementalImport: wrapMethod(
      state,
      implementation,
      beginIncrementalImport
    ),
    commitIncrementalImport: wrapMethod(
      state,
      implementation,
      commitIncrementalImport
    ),
    rollbackIncrementalImport: wrapMethod(
      state,
      implementation,
      rollbackIncrementalImport
    ),
    incrementalImport: wrapMethod(state, implementation, incrementalImport)
  }

  Object.freeze(adapter)

  return adapter
}

export default createAdapter
