import createAdapter from './create-adapter'
import importStream from './import'
import exportStream from './export'
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
import loadEvents from './load-events'
import getNextCursor from './get-next-cursor'
import throwBadCursor from './throw-bad-cursor'
import snapshotTrigger from './snapshot-trigger'
import incrementalImport from './incremental-import'
import {
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
    importStream,
    exportStream,
    wrapMethod,
    wrapEventFilter,
    wrapDispose,
    validateEventFilter,
    loadEvents,
    incrementalImport,
    getNextCursor,
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
  ConcurrentError,
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
}
