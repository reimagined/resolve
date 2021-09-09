import createAdapter from './create-adapter'
import importEventsStream from './import-events'
import exportEventsStream from './export-events'
import validateEventFilter from './validate-event-filter'
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
  AdapterFunctions,
  AdapterPoolConnectedProps,
  CommonAdapterFunctions,
  Adapter,
  AdapterConfig,
} from './types'

export {
  validate,
  isTimestampFilter,
  isCursorFilter,
  AdapterConfigSchema,
  AdapterTableNamesSchema,
  getInitialReplicationState,
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

export { ConcurrentError, ConnectionError, RequestTimeoutError } from './errors'

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
  ResourceAlreadyExistError as EventstoreResourceAlreadyExistError,
  ResourceNotExistError as EventstoreResourceNotExistError,
  EventstoreFrozenError,
  AlreadyFrozenError as EventstoreAlreadyFrozenError,
  AlreadyUnfrozenError as EventstoreAlreadyUnfrozenError,
  throwBadCursor,
  getNextCursor,
  snapshotTrigger,
  iots,
  iotsTypes,
}

export type {
  ImportOptions,
  ExportOptions,
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
  InputEvent,
  VersionlessEvent,
  InputCursor,
  ReturnedCursor,
  EventsWithCursor,
  EventWithCursor,
  EventFilter,
  LatestEventFilter,
  ReplicationStatus,
  ReplicationState,
  OldEvent,
  OldSecretRecord,
  EventStoreDescription,
  UnbrandProps,
  CursorFilter,
  TimestampFilter,
  Adapter,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  AdapterConfig,
  AdapterTableNames,
  AdapterTableNamesProps,
} from './types'

export type { SavedEvent, EventThreadData } from '@resolve-js/core'

export {
  makeSetSecretEvent,
  makeDeleteSecretEvent,
  DELETE_SECRET_EVENT_TYPE,
  SET_SECRET_EVENT_TYPE,
} from './secret-event'
