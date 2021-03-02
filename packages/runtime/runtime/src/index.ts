// FIXME: temporary exposed only from @reimagined/testing-tools.
// This file should be removed.
import { CommandError } from '@reimagined/core'
import {
  default as createQuery,
  CreateQueryOptions,
  detectConnectorFeatures,
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  OMIT_BATCH,
  STOP_BATCH,
} from './common/query'
import {
  default as createCommand,
  CommandExecutorBuilder,
  CommandExecutor,
} from './common/command'

const connectorModes = {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
}

export {
  createQuery,
  CreateQueryOptions,
  createCommand,
  CommandExecutorBuilder,
  CommandError,
  CommandExecutor,
  detectConnectorFeatures,
  connectorModes,
  OMIT_BATCH,
  STOP_BATCH,
}
