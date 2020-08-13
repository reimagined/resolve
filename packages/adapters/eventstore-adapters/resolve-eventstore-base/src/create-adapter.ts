import getLog from './get-log'
import createAdapter from './create-adapter'
import importStream from './import'
import exportStream from './export'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapSaveEvent from './wrap-save-event'
import wrapDispose from './wrap-dispose'
import loadEvents from './load-events'
import getNextCursor from './get-next-cursor'
import incrementalImport from './incremental-import'
import { AdapterImplementation, AdapterState, Status } from './types'

function createAdapter<Connection extends any, Options extends any>(
  adapterImplementation: AdapterImplementation<Connection, Options>,
  options
) {
  const {
    connect,
    loadEventsByCursor,
    loadEventsByTimestamp,
    getLatestEvent,
    saveEvent,
    init,
    drop,
    dispose,
    injectEvent,
    isFrozen,
    freeze,
    unfreeze,
    shapeEvent,
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
  } = adapterImplementation

  const log = getLog(`createAdapter`)
  const state: AdapterState = {
    connection: null,
    status: Status.NOT_CONNECTED
  }

  let bucketSize = 100
  const { snapshotBucketSize } = options
  if (Number.isSafeInteger(snapshotBucketSize) && snapshotBucketSize > 0) {
    bucketSize = snapshotBucketSize
    log.debug(`snapshot bucket size explicitly set to ${bucketSize}`)
  } else {
    log.debug(`snapshot bucket size defaulted to ${bucketSize}`)
  }

  let connectPromiseResolve: Promise<Connection> = Promise.resolve()
  const connectPromise = new Promise(resolve => {
    connectPromiseResolve = resolve.bind(null, null)
  }).then(function<Options extends any>(options: Options) {
    return connect(adapterImplementation, state, options)
  })

  // Object.assign(pool, {
  //   injectEvent: wrapMethod(adapterImplementation, state, injectEvent),
  //   loadEventsByCursor: wrapMethod(adapterImplementation, state, loadEventsByCursor),
  //   loadEventsByTimestamp: wrapMethod(adapterImplementation, state, loadEventsByTimestamp),
  //   // eslint-disable-next-line no-new-func
  //   waitConnect: wrapMethod(pool, Function()),
  //   wrapMethod,
  //   isFrozen: wrapMethod(pool, isFrozen),
  //   connectPromise,
  //   connectPromiseResolve,
  //   shapeEvent,
  //   counters: new Map(),
  //   bucketSize
  // })

  const adapter = {
    loadEvents: wrapMethod(
      adapterImplementation,
      state,
      wrapEventFilter(loadEvents)
    ),
    import: importStream(adapterImplementation, state),
    export: exportStream(adapterImplementation, state),
    getLatestEvent: wrapMethod(adapterImplementation, state, getLatestEvent),
    saveEvent: wrapMethod(
      adapterImplementation,
      state,
      wrapSaveEvent(saveEvent)
    ),
    init: wrapMethod(adapterImplementation, state, init),
    drop: wrapMethod(adapterImplementation, state, drop),
    dispose: wrapDispose(adapterImplementation, state, dispose),
    isFrozen: wrapMethod(adapterImplementation, state, isFrozen),
    freeze: wrapMethod(adapterImplementation, state, freeze),
    unfreeze: wrapMethod(adapterImplementation, state, unfreeze),
    getNextCursor: getNextCursor(adapterImplementation, state),
    loadSnapshot: wrapMethod(adapterImplementation, state, loadSnapshot),
    saveSnapshot: wrapMethod(adapterImplementation, state, saveSnapshot),
    dropSnapshot: wrapMethod(adapterImplementation, state, dropSnapshot),
    getSecret: wrapMethod(adapterImplementation, state, getSecret),
    setSecret: wrapMethod(adapterImplementation, state, setSecret),
    deleteSecret: wrapMethod(adapterImplementation, state, deleteSecret),
    pushIncrementalImport: wrapMethod(
      adapterImplementation,
      state,
      pushIncrementalImport
    ),
    beginIncrementalImport: wrapMethod(
      adapterImplementation,
      state,
      beginIncrementalImport
    ),
    commitIncrementalImport: wrapMethod(
      adapterImplementation,
      state,
      commitIncrementalImport
    ),
    rollbackIncrementalImport: wrapMethod(
      adapterImplementation,
      state,
      rollbackIncrementalImport
    ),
    incrementalImport: wrapMethod(
      adapterImplementation,
      state,
      incrementalImport
    )
  }

  Object.freeze(adapter)

  return adapter
}

export default createAdapter
