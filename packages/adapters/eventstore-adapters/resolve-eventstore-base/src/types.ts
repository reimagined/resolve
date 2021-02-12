import { SecretsManager } from '@reimagined/core'
import stream from 'stream'
import { MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL } from './constants'

export type CheckForResourceError = (errors: Error[]) => void

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]

type DeleteSecret = PropType<SecretsManager, 'deleteSecret'>
type GetSecret = PropType<SecretsManager, 'getSecret'>
type SetSecret = PropType<SecretsManager, 'setSecret'>

type ShapeEvent = (event: any, additionalFields?: any) => any

export type ValidateEventFilter = (filter: any) => void

export type GetNextCursor = (prevCursor: string | null, events: any[]) => string

export type EventsWithCursor = {
  cursor: string | null
  events: any[]
}

type EventFilterCommon = {
  eventTypes?: Array<string> | null
  aggregateIds?: Array<string> | null
  limit: number
  eventsSizeLimit?: number
}

export type TimestampFilter = EventFilterCommon & {
  startTime?: number
  finishTime?: number
}

export type CursorFilter = EventFilterCommon & {
  cursor: string | null
}

export type EventFilter = TimestampFilter | CursorFilter

export type SecretFilter = {
  idx?: number | null
  limit: number
}

export type SecretsWithIdx = {
  idx: number | null
  secrets: SecretRecord[]
}

export type SecretRecord = {
  idx: number
  id: string
  secret: string
}

export function isTimestampFilter(
  filter: EventFilter
): filter is TimestampFilter {
  return (
    (filter as TimestampFilter).startTime != null ||
    (filter as TimestampFilter).finishTime != null
  )
}

export function isCursorFilter(filter: EventFilter): filter is CursorFilter {
  return (filter as CursorFilter).cursor !== undefined
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RemoveFirstType<T extends any[]> = T extends [infer _, ...infer R]
  ? R
  : never

export type PromiseResultType<T extends any> = T extends Promise<infer R>
  ? R
  : T

export type AdapterConfig = {
  snapshotBucketSize?: number
}

export type AdapterPoolPrimalProps = {
  disposed: boolean
  validateEventFilter: ValidateEventFilter

  isInitialized: boolean
  connectPromiseResolve?: any
  connectPromise?: Promise<any>

  maybeThrowResourceError: CheckForResourceError
  bucketSize: number
  counters: Map<string, number>

  getNextCursor: GetNextCursor
}

export type AdapterPoolConnectedProps = Adapter & {
  injectEvent: (event: any) => Promise<any>

  loadEventsByTimestamp: (filter: TimestampFilter) => Promise<EventsWithCursor>
  loadEventsByCursor: (filter: CursorFilter) => Promise<EventsWithCursor>

  deleteSecret: DeleteSecret
  getSecret: GetSecret
  setSecret: SetSecret

  waitConnect: any
  shapeEvent: ShapeEvent

  initEvents: () => Promise<any[]>
  initSecrets: () => Promise<any[]>
  initFinal: () => Promise<any[]>
  dropEvents: () => Promise<any[]>
  dropSecrets: () => Promise<any[]>
  dropFinal: () => Promise<any[]>
}

export type AdapterPoolPossiblyUnconnected<
  ConnectedProps
> = AdapterPoolPrimalProps & Partial<ConnectedProps>

export type AdapterPoolConnected<ConnectedProps> = AdapterPoolPrimalProps &
  ConnectedProps

export type WrappedConnectOnDemandAndCall<
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (pool: AdapterPoolConnected<ConnectedProps>, ...args: any) => any
> = (
  ...args: RemoveFirstType<Parameters<M>>
) => Promise<PromiseResultType<ReturnType<M>>>

export type WrapMethod<ConnectedProps extends AdapterPoolConnectedProps> = {
  <
    M extends (
      pool: AdapterPoolPrimalProps & ConnectedProps,
      ...args: any
    ) => any
  >(
    pool: AdapterPoolPrimalProps & Partial<ConnectedProps>,
    method: M
  ): WrappedConnectOnDemandAndCall<ConnectedProps, M>
  (
    pool: AdapterPoolPrimalProps & Partial<ConnectedProps>,
    method: undefined
  ): null
}

export type WrapDispose<ConnectedProps extends AdapterPoolConnectedProps> = (
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  dispose: Dispose<ConnectedProps>
) => () => Promise<void>

export type LoadEvents<ConnectedProps extends AdapterPoolConnectedProps> = (
  pool: AdapterPoolConnected<ConnectedProps>,
  filter: EventFilter
) => Promise<EventsWithCursor>

export type IncrementImport<
  ConnectedProps extends AdapterPoolConnectedProps
> = (pool: AdapterPoolConnected<ConnectedProps>, events: any[]) => Promise<void>

export type Dispose<ConnectedProps extends AdapterPoolConnectedProps> = (
  pool: AdapterPoolConnected<ConnectedProps>
) => Promise<void>

type MAINTENANCE_MODE =
  | typeof MAINTENANCE_MODE_AUTO
  | typeof MAINTENANCE_MODE_MANUAL

export type ImportOptions = {
  byteOffset: number
  maintenanceMode: MAINTENANCE_MODE
}

export type ExportOptions = {
  cursor: string | null
  maintenanceMode: MAINTENANCE_MODE
  bufferSize: number
}

export type ExportSecretsOptions = {
  idx: number | null
}

export type GetImportStream<
  ConnectedProps extends AdapterPoolConnectedProps
> = (
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  options?: Partial<ImportOptions>
) => stream.Writable

export type GetExportStream<
  ConnectedProps extends AdapterPoolConnectedProps
> = (
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  options?: Partial<ExportOptions>
) => stream.Readable

export interface CommonAdapterFunctions<
  ConnectedProps extends AdapterPoolConnectedProps
> {
  maybeThrowResourceError: CheckForResourceError
  wrapMethod: WrapMethod<ConnectedProps>
  wrapEventFilter: (
    loadEvents: LoadEvents<ConnectedProps>
  ) => LoadEvents<ConnectedProps>
  wrapDispose: WrapDispose<ConnectedProps>
  validateEventFilter: ValidateEventFilter
  loadEvents: LoadEvents<ConnectedProps>
  importEventsStream: GetImportStream<ConnectedProps>
  exportEventsStream: GetExportStream<ConnectedProps>
  incrementalImport: IncrementImport<ConnectedProps>
  getNextCursor: GetNextCursor
  importSecretsStream: (
    pool: AdapterPoolPossiblyUnconnected<ConnectedProps>
  ) => stream.Writable
  exportSecretsStream: (
    pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
    options?: Partial<ExportSecretsOptions>
  ) => stream.Readable
  init: (pool: AdapterPoolConnected<ConnectedProps>) => Promise<void>
  drop: (pool: AdapterPoolConnected<ConnectedProps>) => Promise<void>
}

export interface AdapterFunctions<
  ConnectedProps extends AdapterPoolConnectedProps,
  ConnectionDependencies extends any,
  Config extends AdapterConfig,
  AdapterPool = AdapterPoolConnected<ConnectedProps>
> {
  beginIncrementalImport: (pool: AdapterPool) => Promise<string>
  commitIncrementalImport: (
    pool: AdapterPool,
    importId: string,
    validateAfterCommit: any
  ) => Promise<void>
  connect: (
    pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
    connectionDependencies: ConnectionDependencies,
    config: Config
  ) => Promise<any>
  dispose: Dispose<ConnectedProps>
  dropSnapshot: (pool: AdapterPool, snapshotKey: string) => Promise<any>
  freeze: (pool: AdapterPool) => Promise<void>
  getLatestEvent: (pool: AdapterPool, filter: EventFilter) => Promise<any>
  injectEvent: (pool: AdapterPool, event: any) => Promise<any>
  loadEventsByCursor: (
    pool: AdapterPool,
    filter: CursorFilter
  ) => Promise<EventsWithCursor>
  loadEventsByTimestamp: (
    pool: AdapterPool,
    filter: TimestampFilter
    // eslint-disable-next-line spellcheck/spell-checker
  ) => Promise<EventsWithCursor>
  loadSnapshot: (pool: AdapterPool, snapshotKey: string) => Promise<any>
  pushIncrementalImport: (
    pool: AdapterPool,
    events: any[],
    importId: string
  ) => Promise<void>
  rollbackIncrementalImport: (pool: AdapterPool) => Promise<void>
  saveEvent: (pool: AdapterPool, event: any) => Promise<any>
  saveSnapshot: (
    pool: AdapterPool,
    snapshotKey: string,
    content: string
  ) => Promise<any>
  shapeEvent: ShapeEvent
  unfreeze: (pool: AdapterPool) => Promise<void>
  isFrozen?: () => Promise<boolean>
  getSecret: (pool: AdapterPool, selector: string) => Promise<string | null>
  setSecret: (
    pool: AdapterPool,
    selector: string,
    secret: string
  ) => Promise<void>
  deleteSecret: (pool: AdapterPool, selector: string) => Promise<void>
  loadSecrets?: (
    pool: AdapterPool,
    filter: SecretFilter
  ) => Promise<SecretsWithIdx>
  injectSecret?: (
    pool: AdapterPool,
    secretRecord: SecretRecord
  ) => Promise<void>
  initEvents: (pool: AdapterPool) => Promise<any[]>
  initSecrets: (pool: AdapterPool) => Promise<any[]>
  initFinal: (pool: AdapterPool) => Promise<any[]>
  dropEvents: (pool: AdapterPool) => Promise<any[]>
  dropSecrets: (pool: AdapterPool) => Promise<any[]>
  dropFinal: (pool: AdapterPool) => Promise<any[]>
}

export interface Adapter {
  loadEvents: (filter: EventFilter) => Promise<EventsWithCursor>
  importEvents: (options?: Partial<ImportOptions>) => stream.Writable
  exportEvents: (options?: Partial<ExportOptions>) => stream.Readable
  getLatestEvent: (filter: EventFilter) => Promise<any>
  saveEvent: (event: any) => Promise<any>
  init: () => Promise<void>
  drop: () => Promise<void>
  dispose: () => Promise<any>
  freeze: () => Promise<void>
  unfreeze: () => Promise<void>
  getNextCursor: (prevCursor: string | null, events: any[]) => string
  getSecretsManager: () => Promise<SecretsManager>
  loadSnapshot: (snapshotKey: string) => Promise<any>
  saveSnapshot: (snapshotKey: string, content: string) => Promise<any>
  dropSnapshot: (snapshotKey: string) => Promise<any>
  pushIncrementalImport: (events: any[], importId: string) => Promise<void>
  beginIncrementalImport: () => Promise<string>
  commitIncrementalImport: (
    importId: string,
    validateAfterCommit?: any
  ) => Promise<void>
  rollbackIncrementalImport: () => Promise<void>
  incrementalImport: (events: any[]) => Promise<void>
  loadSecrets?: (filter: SecretFilter) => Promise<SecretsWithIdx>
  injectSecret?: (secretRecord: SecretRecord) => Promise<void>
  importSecrets: () => stream.Writable
  exportSecrets: (options?: Partial<ExportSecretsOptions>) => stream.Readable
}
