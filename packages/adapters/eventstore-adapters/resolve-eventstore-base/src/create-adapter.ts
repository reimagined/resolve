import getLog from './get-log'
import { SecretsManager } from 'resolve-core'
import {
  AdapterPoolPrimalProps,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  Adapter,
  AdapterFunctions,
  CommonAdapterFunctions,
  AdapterConfig,
} from './types'
import { LeveledDebugger } from 'resolve-debug-levels'

// eslint-disable-next-line no-new-func
const idempotentFunction = Function('obj', 'return obj') as <T>(t: T) => T

const getSecretsManager = <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolConnected<ConnectedProps>
): SecretsManager => {
  return {
    deleteSecret: pool.deleteSecret,
    getSecret: pool.getSecret,
    setSecret: pool.setSecret,
  }
}

const createAdapter = <
  ConnectedProps extends AdapterPoolConnectedProps,
  ConnectionDependencies extends any,
  Config extends AdapterConfig
>(
  {
    maybeThrowResourceError,
    wrapMethod,
    wrapEventFilter,
    wrapDispose,
    validateEventFilter,
    loadEvents,
    importStream,
    exportStream,
    incrementalImport,
    getNextCursor,
    importSecretsStream,
    exportSecretsStream,
  }: CommonAdapterFunctions<ConnectedProps>,
  {
    connect,
    loadEventsByCursor,
    loadEventsByTimestamp,
    getLatestEvent,
    saveEvent,
    init,
    drop,
    dispose,
    injectEvent,
    freeze,
    unfreeze,
    shapeEvent,
    loadSnapshot,
    saveSnapshot,
    dropSnapshot,
    beginIncrementalImport,
    commitIncrementalImport,
    rollbackIncrementalImport,
    pushIncrementalImport,
    getSecret,
    setSecret,
    deleteSecret,
    loadSecrets,
    injectSecret,
  }: AdapterFunctions<ConnectedProps, ConnectionDependencies, Config>,
  connectionDependencies: ConnectionDependencies,
  options: Config
): Adapter => {
  const log: LeveledDebugger & debug.Debugger = getLog(`createAdapter`)
  const config: Config = { ...options }

  let bucketSize = 100
  const { snapshotBucketSize } = config
  if (
    snapshotBucketSize !== undefined &&
    Number.isSafeInteger(snapshotBucketSize) &&
    snapshotBucketSize > 0
  ) {
    bucketSize = snapshotBucketSize
    log.debug(`snapshot bucket size explicitly set to ${bucketSize}`)
  } else {
    log.debug(`snapshot bucket size defaulted to ${bucketSize}`)
  }

  const primalProps: AdapterPoolPrimalProps = {
    disposed: false,
    validateEventFilter,
    isInitialized: false,
    maybeThrowResourceError,
    bucketSize,
    getNextCursor: getNextCursor.bind(null),
    counters: new Map(),
  }

  const emptyProps: Partial<ConnectedProps> = {}
  const adapterPool: AdapterPoolPossiblyUnconnected<ConnectedProps> = {
    ...primalProps,
    ...emptyProps,
  }

  adapterPool.connectPromise = new Promise((resolve) => {
    adapterPool.connectPromiseResolve = resolve.bind(null, null)
  }).then(connect.bind(null, adapterPool, connectionDependencies, config))

  const connectedProps: Partial<ConnectedProps> = {
    injectEvent: wrapMethod(adapterPool, injectEvent),
    loadEventsByCursor: wrapMethod(adapterPool, loadEventsByCursor),
    loadEventsByTimestamp: wrapMethod(adapterPool, loadEventsByTimestamp),
    deleteSecret: wrapMethod(adapterPool, deleteSecret),
    getSecret: wrapMethod(adapterPool, getSecret),
    setSecret: wrapMethod(adapterPool, setSecret),
    waitConnect: wrapMethod(adapterPool, idempotentFunction),
    shapeEvent,
  } as Partial<ConnectedProps>

  Object.assign<
    AdapterPoolPossiblyUnconnected<ConnectedProps>,
    Partial<ConnectedProps>
  >(adapterPool, connectedProps)

  const adapter: Adapter = {
    loadEvents: wrapMethod(adapterPool, wrapEventFilter(loadEvents)),
    import: importStream.bind(null, adapterPool),
    export: exportStream.bind(null, adapterPool),
    getLatestEvent: wrapMethod(adapterPool, getLatestEvent),
    saveEvent: wrapMethod(adapterPool, saveEvent),
    init: wrapMethod(adapterPool, init),
    drop: wrapMethod(adapterPool, drop),
    dispose: wrapDispose(adapterPool, dispose),
    freeze: wrapMethod(adapterPool, freeze),
    unfreeze: wrapMethod(adapterPool, unfreeze),
    getNextCursor: getNextCursor.bind(null),
    getSecretsManager: wrapMethod(adapterPool, getSecretsManager),
    loadSnapshot: wrapMethod(adapterPool, loadSnapshot),
    saveSnapshot: wrapMethod(adapterPool, saveSnapshot),
    dropSnapshot: wrapMethod(adapterPool, dropSnapshot),
    pushIncrementalImport: wrapMethod(adapterPool, pushIncrementalImport),
    beginIncrementalImport: wrapMethod(adapterPool, beginIncrementalImport),
    commitIncrementalImport: wrapMethod(adapterPool, commitIncrementalImport),
    rollbackIncrementalImport: wrapMethod(
      adapterPool,
      rollbackIncrementalImport
    ),
    incrementalImport: wrapMethod(adapterPool, incrementalImport),
    loadSecrets:
      loadSecrets === undefined
        ? undefined
        : wrapMethod(adapterPool, loadSecrets),
    injectSecret:
      injectSecret === undefined
        ? undefined
        : wrapMethod(adapterPool, injectSecret),
    importSecrets: importSecretsStream.bind(null, adapterPool),
    exportSecrets: exportSecretsStream.bind(null, adapterPool),
  }

  Object.assign<AdapterPoolPossiblyUnconnected<ConnectedProps>, Adapter>(
    adapterPool,
    adapter
  )

  return Object.freeze(adapter)
}

export default createAdapter
