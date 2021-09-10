import { CommandError } from '@resolve-js/core'
import { default as createQuery, OMIT_BATCH, STOP_BATCH } from './common/query'
import { default as createCommand } from './common/command'
import { failHandler } from './common/handlers/fail-handler'
import { liveRequireHandler } from './common/handlers/live-require-handler'
import { entryPointMarker } from './common/dynamic-require/entry-point-marker'
import { localEntry } from './local/index'

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
}

export type {
  CreateQueryOptions,
  CommandExecutorBuilder,
  CommandError,
  CommandExecutor,
}
