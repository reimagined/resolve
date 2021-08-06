import MySQL from 'mysql2/promise'
import { escape, escapeId } from 'mysql2'

import createAdapter from '@resolve-js/eventstore-base'

import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import ensureEventSubscriber from './ensure-event-subscriber'
import removeEventSubscriber from './remove-event-subscriber'
import getEventSubscribers from './get-event-subscribers'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import injectEvent from './inject-event'
import injectEvents from './inject-events'
import freeze from './freeze'
import unfreeze from './unfreeze'
import shapeEvent from './shape-event'
import saveSnapshot from './save-snapshot'
import loadSnapshot from './load-snapshot'
import dropSnapshot from './drop-snapshot'
import beginIncrementalImport from './begin-incremental-import'
import commitIncrementalImport from './commit-incremental-import'
import rollbackIncrementalImport from './rollback-incremental-import'
import pushIncrementalImport from './push-incremental-import'
import deleteSecret from './delete-secret'
import getSecret from './get-secret'
import setSecret from './set-secret'

import connect from './connect'
import initEvents from './init-events'
import initSecrets from './init-secrets'
import initFinal from './init-final'
import dispose from './dispose'
import dropEvents from './drop-events'
import dropSecrets from './drop-secrets'
import dropFinal from './drop-final'

import describe from './describe'

import type { Adapter } from '@resolve-js/eventstore-base'
import type { ConnectionDependencies, MysqlAdapterConfig } from './types'

const createMysqlAdapter = (options: MysqlAdapterConfig): Adapter => {
  return createAdapter(
    {
      connect,
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
      dispose,
      injectEvent,
      injectEvents,
      freeze,
      unfreeze,
      shapeEvent,
      saveSnapshot,
      loadSnapshot,
      dropSnapshot,
      beginIncrementalImport,
      commitIncrementalImport,
      rollbackIncrementalImport,
      pushIncrementalImport,
      deleteSecret,
      getSecret,
      setSecret,
      describe,
    },
    { MySQL, escapeId, escape } as ConnectionDependencies,
    options
  )
}

export default createMysqlAdapter
export type { MysqlAdapterConfig }
