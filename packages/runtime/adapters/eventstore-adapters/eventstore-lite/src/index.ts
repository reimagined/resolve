import createAdapter from '@resolve-js/eventstore-base'

import beginIncrementalImport from './begin-incremental-import'
import commitIncrementalImport from './commit-incremental-import'
import ensureEventSubscriber from './ensure-event-subscriber'
import removeEventSubscriber from './remove-event-subscriber'
import getEventSubscribers from './get-event-subscribers'
import deleteSecret from './delete-secret'
import dispose from './dispose'
import dropSnapshot from './drop-snapshot'
import dropEvents from './drop-events'
import freeze from './freeze'
import getLatestEvent from './get-latest-event'
import getSecret from './get-secret'
import initEvents from './init-events'
import injectEvent from './inject-event'
import injectEvents from './inject-events'
import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import loadSnapshot from './load-snapshot'
import pushIncrementalImport from './push-incremental-import'
import rollbackIncrementalImport from './rollback-incremental-import'
import saveEvent from './save-event'
import saveSnapshot from './save-snapshot'
import setSecret from './set-secret'
import shapeEvent from './shape-event'
import unfreeze from './unfreeze'
import loadSecrets from './load-secrets'
import injectSecret from './inject-secret'
import initSecrets from './init-secrets'
import dropSecrets from './drop-secrets'
import initFinal from './init-final'
import dropFinal from './drop-final'
import replicateEvents from './replicate-events'
import replicateSecrets from './replicate-secrets'
import setReplicationStatus from './set-replication-status'
import setReplicationPaused from './set-replication-paused'
import getReplicationState from './get-replication-state'
import resetReplication from './reset-replication'
import setReplicationLock from './set-replication-lock'
import getCursorUntilEventTypes from './get-cursor-until-event-types'
import describe from './describe'
import runtimeInfo from './runtime-info'

import configure from './configure'

import type { Adapter } from '@resolve-js/eventstore-base'
import type { SqliteAdapterConfig } from './types'

const createSqliteAdapter = (options: SqliteAdapterConfig): Adapter => {
  return createAdapter(
    {
      beginIncrementalImport,
      commitIncrementalImport,
      ensureEventSubscriber,
      removeEventSubscriber,
      getEventSubscribers,
      deleteSecret,
      dispose,
      dropSnapshot,
      dropEvents,
      dropSecrets,
      dropFinal,
      freeze,
      getLatestEvent,
      getSecret,
      initEvents,
      initSecrets,
      initFinal,
      injectEvent,
      injectEvents,
      loadEventsByCursor,
      loadEventsByTimestamp,
      loadSnapshot,
      pushIncrementalImport,
      rollbackIncrementalImport,
      saveEvent,
      saveSnapshot,
      setSecret,
      shapeEvent,
      unfreeze,
      loadSecrets,
      injectSecret,
      replicateEvents,
      replicateSecrets,
      setReplicationStatus,
      setReplicationPaused,
      getReplicationState,
      resetReplication,
      setReplicationLock,
      getCursorUntilEventTypes,
      describe,
      runtimeInfo,
    },
    options,
    configure
  )
}

export default createSqliteAdapter
export type { SqliteAdapterConfig }
