import { CommandError } from '@resolve-js/core'
import { default as createQuery, OMIT_BATCH, STOP_BATCH } from './common/query'
import { default as createCommand } from './common/command'
import { failHandler } from './common/handlers/fail-handler'
import { liveRequireHandler } from './common/handlers/live-require-handler'
import { getRootBasedUrl } from './common/utils/get-root-based-url'
import { entryPointMarker } from './common/dynamic-require/entry-point-marker'
import { localEntry } from './local/index'
import getStaticBasedPath from './common/utils/get-static-based-path'
import jsonUtfStringify from './common/utils/json-utf-stringify'

import type { CreateQueryOptions } from './common/query'
import type { CommandExecutorBuilder, CommandExecutor } from './common/command'

export {
  createQuery,
  createCommand,
  OMIT_BATCH,
  STOP_BATCH,
  failHandler,
  liveRequireHandler,
  getRootBasedUrl,
  getStaticBasedPath,
  jsonUtfStringify,
  entryPointMarker,
  localEntry,
}

export type {
  CreateQueryOptions,
  CommandExecutorBuilder,
  CommandError,
  CommandExecutor,
}
