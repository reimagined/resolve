// FIXME: temporary exposed only from @resolve-js/testing-tools.
// This file should be removed.
import { CommandError } from '@resolve-js/core'
import {
  default as createQuery,
  CreateQueryOptions,
  OMIT_BATCH,
  STOP_BATCH,
} from './common/query'
import {
  default as createCommand,
  CommandExecutorBuilder,
  CommandExecutor,
} from './common/command'

export {
  createQuery,
  CreateQueryOptions,
  createCommand,
  CommandExecutorBuilder,
  CommandError,
  CommandExecutor,
  OMIT_BATCH,
  STOP_BATCH,
}
