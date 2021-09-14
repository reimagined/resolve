import { CommandError } from '@resolve-js/core'

// @resolve-js/runtime-base
import { default as createQuery, OMIT_BATCH, STOP_BATCH } from './common/query'
import { default as createCommand } from './common/command'
import { emptyReadModelConnector } from './common/defaults/empty-read-model-connector'
import { failHandler } from './common/handlers/fail-handler'
import { liveRequireHandler } from './common/handlers/live-require-handler'
import { entryPointMarker } from './common/dynamic-require/entry-point-marker'
import { disabledEncryption } from './common/defaults/disabled-encryption'
import { wrapReadModelConnector } from './common/wrap-readmodel-connector'

// @resolve-js/runtime-local
import { localEntry } from './local/index'
import { queryIsReadyHandler } from './local/query-is-ready-handler'
import { exportEventStoreHandler } from './local/export-event-store-handler'
import { importEventStoreHandler } from './local/import-event-store-handler'
import { resetDomainHandler } from './local/reset-domain-handler'

import type { CreateQueryOptions } from './common/query'
import type { CommandExecutorBuilder, CommandExecutor } from './common/command'

export {
  createQuery,
  createCommand,
  OMIT_BATCH,
  STOP_BATCH,
  failHandler,
  liveRequireHandler,
  entryPointMarker,
  localEntry,
  queryIsReadyHandler,
  exportEventStoreHandler,
  importEventStoreHandler,
  resetDomainHandler,
  emptyReadModelConnector,
  disabledEncryption,
  wrapReadModelConnector,
}

export type {
  CreateQueryOptions,
  CommandExecutorBuilder,
  CommandError,
  CommandExecutor,
}
