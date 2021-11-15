import { getLog } from './get-log'
import type { SecretsManager } from '@resolve-js/core'
import type {
  Adapter,
  AdapterFunctions,
  CommonAdapterFunctions,
  AdapterConfig,
  AdapterPoolPrivateBoundProps,
  AdapterPoolBoundProps,
  AdapterPrimalPool,
  AdapterBoundPool,
} from './types'
import type { LeveledDebugger } from '@resolve-js/debug-levels'
import bindMethod from './bind-method'
import wrapEventFilter from './wrap-event-filter'
import wrapDispose from './wrap-dispose'

const getSecretsManager = <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>
): SecretsManager => {
  return {
    deleteSecret: pool.deleteSecret,
    getSecret: pool.getSecret,
    setSecret: pool.setSecret,
  }
}

const createAdapter = <
  ConfiguredProps extends {},
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
  }: CommonAdapterFunctions<ConfiguredProps>,
  {
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
    setReplicationLock,
    getCursorUntilEventTypes,
    describe,
    establishTimeLimit,
    getEventLoaderNative,
  }: AdapterFunctions<ConfiguredProps>,
  options: Config,
  configure: (props: AdapterPrimalPool<ConfiguredProps>, config: Config) => void
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

  const emptyProps: Partial<ConfiguredProps> &
    Partial<AdapterPoolBoundProps> = {}

  const adapterPool: AdapterPrimalPool<ConfiguredProps> = {
    disposed: false,
    validateEventFilter,
    isConnected: false,
    maybeThrowResourceError,
    bucketSize,
    getNextCursor: getNextCursor.bind(null),
    counters: new Map(),
    ...emptyProps,
  }

  configure(adapterPool, config)

  const connectedProps: AdapterPoolPrivateBoundProps = {
    injectEvent: bindMethod(adapterPool, injectEvent),
    injectEvents: bindMethod(adapterPool, injectEvents),
    injectSecret: bindMethod(adapterPool, injectSecret),
    loadEventsByCursor: bindMethod(adapterPool, loadEventsByCursor),
    loadEventsByTimestamp: bindMethod(adapterPool, loadEventsByTimestamp),
    deleteSecret: bindMethod(adapterPool, deleteSecret),
    getSecret: bindMethod(adapterPool, getSecret),
    setSecret: bindMethod(adapterPool, setSecret),
    initEvents: bindMethod(adapterPool, initEvents),
    initSecrets: bindMethod(adapterPool, initSecrets),
    initFinal: bindMethod(adapterPool, initFinal),
    dropEvents: bindMethod(adapterPool, dropEvents),
    dropSecrets: bindMethod(adapterPool, dropSecrets),
    dropFinal: bindMethod(adapterPool, dropFinal),
    shapeEvent,
    getEventLoaderNative:
      getEventLoaderNative !== undefined
        ? bindMethod(adapterPool, getEventLoaderNative)
        : getEventLoaderNative,
  }

  Object.assign<
    AdapterPrimalPool<ConfiguredProps>,
    AdapterPoolPrivateBoundProps
  >(adapterPool, connectedProps)

  const adapter: Adapter = {
    loadEvents: bindMethod(adapterPool, wrapEventFilter(loadEvents)),
    importEvents: bindMethod(adapterPool, importEventsStream),
    exportEvents: bindMethod(adapterPool, exportEventsStream),
    getLatestEvent: bindMethod(adapterPool, getLatestEvent),
    saveEvent: bindMethod(adapterPool, saveEvent),
    init: bindMethod(adapterPool, init),
    drop: bindMethod(adapterPool, drop),
    dispose: wrapDispose(adapterPool, dispose),
    freeze: bindMethod(adapterPool, freeze),
    unfreeze: bindMethod(adapterPool, unfreeze),
    getNextCursor: getNextCursor.bind(null),
    getSecretsManager: bindMethod(adapterPool, getSecretsManager),
    loadSnapshot: bindMethod(adapterPool, loadSnapshot),
    saveSnapshot: bindMethod(adapterPool, saveSnapshot),
    dropSnapshot: bindMethod(adapterPool, dropSnapshot),
    pushIncrementalImport: bindMethod(adapterPool, pushIncrementalImport),
    beginIncrementalImport: bindMethod(adapterPool, beginIncrementalImport),
    commitIncrementalImport: bindMethod(adapterPool, commitIncrementalImport),
    rollbackIncrementalImport: bindMethod(
      adapterPool,
      rollbackIncrementalImport
    ),
    incrementalImport: bindMethod(adapterPool, incrementalImport),
    loadSecrets: bindMethod(adapterPool, loadSecrets),
    importSecrets: bindMethod(adapterPool, importSecretsStream),
    exportSecrets: bindMethod(adapterPool, exportSecretsStream),

    ensureEventSubscriber: bindMethod(adapterPool, ensureEventSubscriber),
    removeEventSubscriber: bindMethod(adapterPool, removeEventSubscriber),
    getEventSubscribers: bindMethod(adapterPool, getEventSubscribers),

    gatherSecretsFromEvents: bindMethod(adapterPool, gatherSecretsFromEvents),

    replicateEvents: bindMethod(adapterPool, replicateEvents),
    replicateSecrets: bindMethod(adapterPool, replicateSecrets),
    setReplicationPaused: bindMethod(adapterPool, setReplicationPaused),
    setReplicationStatus: bindMethod(adapterPool, setReplicationStatus),
    getReplicationState: bindMethod(adapterPool, getReplicationState),
    resetReplication: bindMethod(adapterPool, resetReplication),
    setReplicationLock: bindMethod(adapterPool, setReplicationLock),

    getCursorUntilEventTypes: bindMethod(adapterPool, getCursorUntilEventTypes),
    describe: bindMethod(adapterPool, describe),
    establishTimeLimit:
      establishTimeLimit === undefined
        ? (f: () => number) => {
            return
          }
        : establishTimeLimit.bind(
            null,
            adapterPool as AdapterBoundPool<ConfiguredProps>
          ),
    getEventLoader: bindMethod(adapterPool, getEventLoader),
  }

  Object.assign<AdapterPrimalPool<ConfiguredProps>, Adapter>(
    adapterPool,
    adapter
  )

  return Object.freeze(adapter)
}

export default createAdapter
