import createAdapter from './create-adapter'
import importEventsStream from './import-events'
import exportEventsStream from './export-events'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapDispose from './wrap-dispose'
import validateEventFilter from './validate-event-filter'
import ConcurrentError from './concurrent-error'
import {
  ResourceAlreadyExistError,
  ResourceNotExistError,
  maybeThrowResourceError,
} from './resource-errors'
import {
  EventstoreFrozenError,
  AlreadyFrozenError,
  AlreadyUnfrozenError,
} from './frozen-errors'
import loadEvents from './load-events'
import getNextCursor from './get-next-cursor'
import throwBadCursor from './throw-bad-cursor'
import snapshotTrigger from './snapshot-trigger'
import incrementalImport from './incremental-import'
import importSecretsStream from './import-secrets'
import exportSecretsStream from './export-secrets'
import init from './init'
import drop from './drop'
import gatherSecretsFromEvents from './gather-secrets-from-events'
import * as iots from 'io-ts'
import * as iotsTypes from 'io-ts-types'

import type {
  UnbrandProps,
  CursorFilter,
  TimestampFilter,
  Adapter,
  AdapterFunctions,
  AdapterPoolConnectedProps,
  CommonAdapterFunctions,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
  AdapterConfig,
  EventStoreDescription,
} from './types'

import {
  validate,
  isTimestampFilter,
  isCursorFilter,
  AdapterConfigSchema,
} from './types'

export {
  threadArrayToCursor,
  cursorToThreadArray,
  initThreadArray,
  emptyLoadEventsResult,
  checkEventsContinuity,
} from './cursor-operations'
export {
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
  THREAD_COUNT,
  CURSOR_BUFFER_SIZE,
  THREAD_COUNTER_BYTE_LENGTH,
} from './constants'

const wrappedCreateAdapter = <
  ConnectedProps extends AdapterPoolConnectedProps,
  ConnectionDependencies extends any,
  Config extends AdapterConfig
>(
  adapterFunctions: AdapterFunctions<
    ConnectedProps,
    ConnectionDependencies,
    Config
  >,
  connectionDependencies: ConnectionDependencies,
  options: Config
): Adapter => {
  const commonFunctions: CommonAdapterFunctions<ConnectedProps> = {
    maybeThrowResourceError,
    importEventsStream,
    exportEventsStream,
    wrapMethod,
    wrapEventFilter,
    wrapDispose,
    validateEventFilter,
    loadEvents,
    incrementalImport,
    getNextCursor,
    exportSecretsStream,
    importSecretsStream,
    init,
    drop,
    gatherSecretsFromEvents,
  }

  return createAdapter(
    commonFunctions,
    adapterFunctions,
    connectionDependencies,
    options
  )
}

export default wrappedCreateAdapter

export {
  validate,
  ResourceAlreadyExistError as EventstoreResourceAlreadyExistError,
  ResourceNotExistError as EventstoreResourceNotExistError,
  ConcurrentError,
  EventstoreFrozenError,
  AlreadyFrozenError as EventstoreAlreadyFrozenError,
  AlreadyUnfrozenError as EventstoreAlreadyUnfrozenError,
  throwBadCursor,
  getNextCursor,
  snapshotTrigger,
  isTimestampFilter,
  isCursorFilter,
  AdapterConfigSchema,
  iots,
  iotsTypes,
}

export type {
  UnbrandProps,
  CursorFilter,
  TimestampFilter,
  Adapter,
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterConfig,
}

export type {
  ImportOptions,
  ExportOptions,
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
  InputEvent,
  SavedEvent,
  EventThreadData,
  Cursor,
  EventsWithCursor,
  EventWithCursor,
  EventFilter,
  ReplicationStatus,
  ReplicationState,
  OldEvent,
  OldSecretRecord,
  EventStoreDescription,
} from './types'

export { getInitialReplicationState } from './types'

export {
  makeSetSecretEvent,
  makeDeleteSecretEvent,
  DELETE_SECRET_EVENT_TYPE,
  SET_SECRET_EVENT_TYPE,
} from './secret-event'
