import createAdapter from './create-adapter'
import importEventsStream from './import-events'
import exportEventsStream from './export-events'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapDispose from './wrap-dispose'
import validateEventFilter from './validate-event-filter'
import { MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL } from './constants'
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
import * as iots from 'io-ts'

import {
  validate,
  UnbrandProps,
  CursorFilter,
  TimestampFilter,
  isTimestampFilter,
  isCursorFilter,
  EventsWithCursor,
  EventFilter,
  Adapter,
  AdapterFunctions,
  AdapterPoolConnectedProps,
  CommonAdapterFunctions,
  AdapterPoolPossiblyUnconnected,
  AdapterPoolConnected,
  AdapterConfig,
  AdapterConfigSchema,
  ImportOptions,
  ExportOptions,
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
  InputEvent,
  SavedEvent,
} from './types'

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
  UnbrandProps,
  ResourceAlreadyExistError as EventstoreResourceAlreadyExistError,
  ResourceNotExistError as EventstoreResourceNotExistError,
  ConcurrentError,
  EventstoreFrozenError,
  AlreadyFrozenError as EventstoreAlreadyFrozenError,
  AlreadyUnfrozenError as EventstoreAlreadyUnfrozenError,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
  throwBadCursor,
  getNextCursor,
  snapshotTrigger,
  CursorFilter,
  TimestampFilter,
  isTimestampFilter,
  isCursorFilter,
  EventsWithCursor,
  EventFilter,
  Adapter,
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  AdapterPoolPossiblyUnconnected,
  AdapterConfig,
  AdapterConfigSchema,
  ImportOptions,
  ExportOptions,
  SecretFilter,
  SecretsWithIdx,
  SecretRecord,
  InputEvent,
  SavedEvent,
  iots,
}
