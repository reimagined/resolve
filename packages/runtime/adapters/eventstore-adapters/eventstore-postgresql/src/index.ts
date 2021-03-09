import { Client as Postgres } from 'pg'
import createAdapter from '@resolve-js/eventstore-base'

import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import ensureEventSubscriber from './ensure-event-subscriber'
import removeEventSubscriber from './remove-event-subscriber'
import getEventSubscribers from './get-event-subscribers'
import freeze from './freeze'
import unfreeze from './unfreeze'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import fullJitter from './full-jitter'
import executeStatement from './execute-statement'
import injectEvent from './inject-event'
import coercer from './coercer'
import escapeId from './escape-id'
import escape from './escape'
import shapeEvent from './shape-event'
import loadSnapshot from './load-snapshot'
import saveSnapshot from './save-snapshot'
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
import dropEvents from './drop-events'
import dropSecrets from './drop-secrets'
import dropFinal from './drop-final'
import dispose from './dispose'
import injectSecret from './inject-secret'
import loadSecrets from './load-secrets'

import type { Adapter } from '@resolve-js/eventstore-base'
import type { ConnectionDependencies, PostgresqlAdapterConfig } from './types'

const createPostgresqlAdapter = (options: PostgresqlAdapterConfig): Adapter => {
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
      injectEvent,
      deleteSecret,
      getSecret,
      setSecret,
      injectSecret,
      loadSecrets,
    },
    {
      Postgres,
      escapeId,
      escape,
      fullJitter,
      executeStatement,
      coercer,
    } as ConnectionDependencies,
    options
  )
}

export default createPostgresqlAdapter
export type { PostgresqlAdapterConfig }
