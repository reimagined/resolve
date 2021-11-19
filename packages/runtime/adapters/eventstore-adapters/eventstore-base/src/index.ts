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
import getEventLoader from './get-event-loader'
import * as iots from 'io-ts'
import * as iotsTypes from 'io-ts-types'

import type {
  AdapterFunctions,
  CommonAdapterFunctions,
  Adapter,
  AdapterConfig,
  AdapterPrimalPool,
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

export * from './errors'

const wrappedCreateAdapter = <
  ConfiguredProps extends {},
  Config extends AdapterConfig
>(
  adapterFunctions: AdapterFunctions<ConfiguredProps>,
  options: Config,
  configure: (props: AdapterPrimalPool<ConfiguredProps>, config: Config) => void
): Adapter => {
  const commonFunctions: CommonAdapterFunctions<ConfiguredProps> = {
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
    getEventLoader,
  }

  return createAdapter(commonFunctions, adapterFunctions, options, configure)
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
  Cursor,
  StoredEventBatchPointer,
  StoredEventPointer,
  EventFilter,
  LatestEventFilter,
  ReplicationStatus,
  ReplicationState,
  OldEvent,
  OldSecretRecord,
  UnbrandProps,
  CursorFilter,
  TimestampFilter,
  Adapter,
  AdapterPrimalPool,
  AdapterBoundPool,
  AdapterConfig,
  AdapterTableNames,
  AdapterTableNamesProps,
  GatheredSecrets,
  EventLoaderFilter,
  EventLoader,
} from './types'

export type {
  StoredEvent,
  EventThreadData,
  EventStoreDescription,
  EventStoreDescribeOptions as DescribeOptions,
} from '@resolve-js/core'

export {
  makeSetSecretEvent,
  makeDeleteSecretEvent,
  DELETE_SECRET_EVENT_TYPE,
  SET_SECRET_EVENT_TYPE,
} from './secret-event'
