import { getLog } from './get-log'
import type { SecretsManager } from '@resolve-js/core'
import type {
  AdapterPoolPrimalProps,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  Adapter,
  AdapterFunctions,
  CommonAdapterFunctions,
  AdapterConfig,
  AdapterPoolPrivateConnectedProps,
} from './types'
import type { LeveledDebugger } from '@resolve-js/debug-levels'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapDispose from './wrap-dispose'

const emptyFunction = async <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolConnected<ConnectedProps>
): Promise<void> => {
  return
}

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
    validateEventFilter,
    loadEvents,
    importEventsStream,
    exportEventsStream,
    incrementalImport,
    getNextCursor,
    importSecretsStream,
    exportSecretsStream,
    init,
    drop,
    gatherSecretsFromEvents,
    getEventLoader,
  }: CommonAdapterFunctions<ConnectedProps>,
  {
    connect,
    dispose,
    loadEventsByCursor,
    loadEventsByTimestamp,
    ensureEventSubscriber,
    removeEventSubscriber,
    getEventSubscribers,
    getLatestEvent,
    saveEvent,
    initEvents,
    initSecrets,
    initFinal,
    dropEvents,
    dropSecrets,
    dropFinal,
    injectEvent,
    injectEvents,
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
    replicateEvents,
    replicateSecrets,
    setReplicationPaused,
    setReplicationStatus,
    getReplicationState,
    resetReplication,
    getCursorUntilEventTypes,
    describe,
    establishTimeLimit,
    getEventLoaderNative,
  }: AdapterFunctions<ConnectedProps, ConnectionDependencies, Config>,
  connectionDependencies: ConnectionDependencies,
  options: Config,
  prepare?: (
    props: AdapterPoolPossiblyUnconnected<ConnectedProps>,
    config: Config,
    dependencies: ConnectionDependencies
  ) => void
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

  const createGetConnectPromise = () => {
    let p: Promise<void>
    return () => {
      if (p === undefined) {
        p = connect(adapterPool, connectionDependencies, config)
      }
      return p
    }
  }

  const primalProps: AdapterPoolPrimalProps = {
    disposed: false,
    validateEventFilter,
    isConnected: false,
    maybeThrowResourceError,
    bucketSize,
    getNextCursor: getNextCursor.bind(null),
    counters: new Map(),
    createGetConnectPromise: createGetConnectPromise,
    getConnectPromise: createGetConnectPromise(),
  }

  const emptyProps: Partial<ConnectedProps> = {}
  const adapterPool: AdapterPoolPossiblyUnconnected<ConnectedProps> = {
    ...primalProps,
    ...emptyProps,
  }
  if (prepare !== undefined) {
    prepare(adapterPool, config, connectionDependencies)
  }

  const connectedProps: AdapterPoolPrivateConnectedProps = {
    injectEvent: wrapMethod(adapterPool, injectEvent),
    injectEvents: wrapMethod(adapterPool, injectEvents),
    injectSecret: wrapMethod(adapterPool, injectSecret),
    loadEventsByCursor: wrapMethod(adapterPool, loadEventsByCursor),
    loadEventsByTimestamp: wrapMethod(adapterPool, loadEventsByTimestamp),
    deleteSecret: wrapMethod(adapterPool, deleteSecret),
    getSecret: wrapMethod(adapterPool, getSecret),
    setSecret: wrapMethod(adapterPool, setSecret),
    initEvents: wrapMethod(adapterPool, initEvents),
    initSecrets: wrapMethod(adapterPool, initSecrets),
    initFinal: wrapMethod(adapterPool, initFinal),
    dropEvents: wrapMethod(adapterPool, dropEvents),
    dropSecrets: wrapMethod(adapterPool, dropSecrets),
    dropFinal: wrapMethod(adapterPool, dropFinal),
    waitConnect: wrapMethod(adapterPool, emptyFunction),
    shapeEvent,
    getEventLoaderNative: getEventLoaderNative
      ? async (filter) => {
          return getEventLoaderNative(
            adapterPool as AdapterPoolConnected<ConnectedProps>,
            filter
          )
        }
      : getEventLoaderNative,
  }

  Object.assign<
    AdapterPoolPossiblyUnconnected<ConnectedProps>,
    AdapterPoolPrivateConnectedProps
  >(adapterPool, connectedProps)

  const adapter: Adapter = {
    loadEvents: wrapMethod(adapterPool, wrapEventFilter(loadEvents)),
    importEvents: importEventsStream.bind(null, adapterPool),
    exportEvents: exportEventsStream.bind(null, adapterPool),
    getLatestEvent: wrapMethod(adapterPool, getLatestEvent),
    saveEvent: wrapMethod(adapterPool, saveEvent),
    init: wrapMethod(adapterPool, init),
    drop: wrapMethod(adapterPool, drop),
    dispose: wrapDispose(adapterPool, dispose),
    freeze: wrapMethod(adapterPool, freeze),
    unfreeze: wrapMethod(adapterPool, unfreeze),
    getNextCursor: getNextCursor.bind(null),
    getSecretsManager: async () => {
      return getSecretsManager(
        adapterPool as AdapterPoolConnected<ConnectedProps>
      )
    },
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
    loadSecrets: wrapMethod(adapterPool, loadSecrets),
    importSecrets: importSecretsStream.bind(null, adapterPool),
    exportSecrets: exportSecretsStream.bind(null, adapterPool),

    ensureEventSubscriber: wrapMethod(adapterPool, ensureEventSubscriber),
    removeEventSubscriber: wrapMethod(adapterPool, removeEventSubscriber),
    getEventSubscribers: wrapMethod(adapterPool, getEventSubscribers),

    gatherSecretsFromEvents: wrapMethod(adapterPool, gatherSecretsFromEvents),

    replicateEvents: wrapMethod(adapterPool, replicateEvents),
    replicateSecrets: wrapMethod(adapterPool, replicateSecrets),
    setReplicationPaused: wrapMethod(adapterPool, setReplicationPaused),
    setReplicationStatus: wrapMethod(adapterPool, setReplicationStatus),
    getReplicationState: wrapMethod(adapterPool, getReplicationState),
    resetReplication: wrapMethod(adapterPool, resetReplication),

    getCursorUntilEventTypes: wrapMethod(adapterPool, getCursorUntilEventTypes),
    describe: wrapMethod(adapterPool, describe),
    establishTimeLimit:
      establishTimeLimit === undefined
        ? (f: () => number) => {
            return
          }
        : establishTimeLimit.bind(null, adapterPool),
    getEventLoader: async (filter, options) => {
      return getEventLoader(
        adapterPool as AdapterPoolConnected<ConnectedProps>,
        filter,
        options
      )
    },
  }

  Object.assign<AdapterPoolPossiblyUnconnected<ConnectedProps>, Adapter>(
    adapterPool,
    adapter
  )

  return Object.freeze(adapter)
}

export default createAdapter
