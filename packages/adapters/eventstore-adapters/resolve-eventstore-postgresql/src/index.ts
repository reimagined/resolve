import { Client as Postgres } from 'pg'
import createAdapter from 'resolve-eventstore-base'

import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
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
import init from './init'
import drop from './drop'
import dispose from './dispose'

import type { Adapter } from 'resolve-eventstore-base'
import type { ConnectionDependencies, PostgresqlAdapterConfig } from './types'

const createPostgresqlAdapter = (options: PostgresqlAdapterConfig): Adapter => {
  return createAdapter(
    {
      connect,
      loadEventsByCursor,
      loadEventsByTimestamp,
      getLatestEvent,
      saveEvent,
      init,
      drop,
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
