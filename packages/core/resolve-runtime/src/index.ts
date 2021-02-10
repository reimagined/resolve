// FIXME: temporary exposed only from resolve-testing-tools.
// This file should be removed.
import { CommandError } from 'resolve-core'
import { default as createQuery, CreateQueryOptions } from './common/query'
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
}
