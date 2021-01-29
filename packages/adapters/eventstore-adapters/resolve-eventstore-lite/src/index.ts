import createAdapter from 'resolve-eventstore-base'
import sqlite from 'sqlite'
import tmp from 'tmp'
import os from 'os'
import fs from 'fs'

import beginIncrementalImport from './begin-incremental-import'
import commitIncrementalImport from './commit-incremental-import'
import connect from './connect'
import deleteSecret from './delete-secret'
import dispose from './dispose'
import dropSnapshot from './drop-snapshot'
import drop from './drop'
import freeze from './freeze'
import getLatestEvent from './get-latest-event'
import getSecret from './get-secret'
import init from './init'
import injectEvent from './inject-event'
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

import type { Adapter } from 'resolve-eventstore-base'
import type { ConnectionDependencies, SqliteAdapterConfig } from './types'

const createSqliteAdapter = (options: SqliteAdapterConfig): Adapter => {
  return createAdapter(
    {
      beginIncrementalImport,
      commitIncrementalImport,
      connect,
      deleteSecret,
      dispose,
      dropSnapshot,
      drop,
      freeze,
      getLatestEvent,
      getSecret,
      init,
      injectEvent,
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
    },
    { sqlite, tmp, os, fs } as ConnectionDependencies,
    options
  )
}

export default createSqliteAdapter
