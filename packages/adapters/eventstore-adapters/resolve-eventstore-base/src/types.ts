import { SecretsManager, Event, SerializableMap } from 'resolve-core'
import stream from 'stream'
import { MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL } from './constants'

export type InputEvent = Event
export type SavedEvent = Event & {
  threadCounter: number
  threadId: number
} & SerializableMap

export type CheckForResourceError = (errors: Error[]) => void

type DeleteSecret = SecretsManager['deleteSecret']
type GetSecret = SecretsManager['getSecret']
type SetSecret = SecretsManager['setSecret']

type ShapeEvent = (event: any, additionalFields?: any) => SavedEvent

export type ValidateEventFilter = (filter: any) => void

export type GetNextCursor = (prevCursor: string | null, events: any[]) => string

export type EventsWithCursor = {
  cursor: string | null
  events: SavedEvent[]
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

export type PoolMethod<
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (...args: any) => any
> = (
  pool: AdapterPoolConnected<ConnectedProps>,
  ...args: Parameters<M>
) => ReturnType<M>

export type UnconnectedPoolMethod<
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (...args: any) => any
> = (
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  ...args: Parameters<M>
) => ReturnType<M>

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
  injectEvent: (event: SavedEvent) => Promise<void>
  injectSecret?: (secretRecord: SecretRecord) => Promise<void>

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
  ConnectedProps extends AdapterPoolConnectedProps
> = AdapterPoolPrimalProps & Partial<ConnectedProps>

export type AdapterPoolConnected<
  ConnectedProps extends AdapterPoolConnectedProps
> = AdapterPoolPrimalProps & ConnectedProps

export type WrappedConnectOnDemandAndCall<
  ConnectedProps extends AdapterPoolConnectedProps,
  M extends (pool: AdapterPoolConnected<ConnectedProps>, ...args: any) => any
> = (
  ...args: RemoveFirstType<Parameters<M>>
) => Promise<PromiseResultType<ReturnType<M>>>

type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T
  ? 1
  : 2) extends <G>() => G extends U ? 1 : 2
  ? Y
  : N

export type WrapMethod<ConnectedProps extends AdapterPoolConnectedProps> = <
  M extends
    | undefined
    | ((pool: AdapterPoolConnected<ConnectedProps>, ...args: any) => any)
>(
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  method: M
) => IfEquals<
  M,
  undefined,
  undefined,
  WrappedConnectOnDemandAndCall<ConnectedProps, Exclude<M, undefined>>
>

export type WrapDispose<ConnectedProps extends AdapterPoolConnectedProps> = (
  pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
  dispose: PoolMethod<ConnectedProps, Adapter['dispose']>
) => () => Promise<void>

export type MAINTENANCE_MODE =
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

export type ImportSecretsOptions = {
  maintenanceMode: MAINTENANCE_MODE
}

export type ExportSecretsOptions = {
  idx: number | null
  maintenanceMode: MAINTENANCE_MODE
}

export interface CommonAdapterFunctions<
  ConnectedProps extends AdapterPoolConnectedProps
> {
  maybeThrowResourceError: CheckForResourceError
  wrapMethod: WrapMethod<ConnectedProps>
  wrapEventFilter: (
    loadEvents: PoolMethod<ConnectedProps, Adapter['loadEvents']>
  ) => PoolMethod<ConnectedProps, Adapter['loadEvents']>
  wrapDispose: WrapDispose<ConnectedProps>
  validateEventFilter: ValidateEventFilter
  loadEvents: PoolMethod<ConnectedProps, Adapter['loadEvents']>
  importEventsStream: UnconnectedPoolMethod<
    ConnectedProps,
    Adapter['importEvents']
  >
  exportEventsStream: UnconnectedPoolMethod<
    ConnectedProps,
    Adapter['exportEvents']
  >
  incrementalImport: PoolMethod<ConnectedProps, Adapter['incrementalImport']>
  getNextCursor: GetNextCursor
  importSecretsStream: UnconnectedPoolMethod<
    ConnectedProps,
    Adapter['importSecrets']
  >
  exportSecretsStream: UnconnectedPoolMethod<
    ConnectedProps,
    Adapter['exportSecrets']
  >
  init: PoolMethod<ConnectedProps, Adapter['init']>
  drop: PoolMethod<ConnectedProps, Adapter['drop']>
}

export interface AdapterFunctions<
  ConnectedProps extends AdapterPoolConnectedProps,
  ConnectionDependencies extends any,
  Config extends AdapterConfig
> {
  beginIncrementalImport: PoolMethod<
    ConnectedProps,
    Adapter['beginIncrementalImport']
  >
  commitIncrementalImport: PoolMethod<
    ConnectedProps,
    Adapter['commitIncrementalImport']
  >
  connect: (
    pool: AdapterPoolPossiblyUnconnected<ConnectedProps>,
    connectionDependencies: ConnectionDependencies,
    config: Config
  ) => Promise<void>
  dispose: PoolMethod<ConnectedProps, Adapter['dispose']>
  dropSnapshot: PoolMethod<ConnectedProps, Adapter['dropSnapshot']>
  freeze: PoolMethod<ConnectedProps, Adapter['freeze']>
  getLatestEvent: PoolMethod<ConnectedProps, Adapter['getLatestEvent']>
  injectEvent: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['injectEvent']
  >
  loadEventsByCursor: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['loadEventsByCursor']
  >
  loadEventsByTimestamp: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['loadEventsByTimestamp']
  >
  loadSnapshot: PoolMethod<ConnectedProps, Adapter['loadSnapshot']>
  pushIncrementalImport: PoolMethod<
    ConnectedProps,
    Adapter['pushIncrementalImport']
  >
  rollbackIncrementalImport: PoolMethod<
    ConnectedProps,
    Adapter['rollbackIncrementalImport']
  >
  saveEvent: PoolMethod<ConnectedProps, Adapter['saveEvent']>
  saveSnapshot: PoolMethod<ConnectedProps, Adapter['saveSnapshot']>
  shapeEvent: ShapeEvent
  unfreeze: PoolMethod<ConnectedProps, Adapter['unfreeze']>
  getSecret: PoolMethod<ConnectedProps, GetSecret>
  setSecret: PoolMethod<ConnectedProps, SetSecret>
  deleteSecret: PoolMethod<ConnectedProps, DeleteSecret>
  loadSecrets?: PoolMethod<ConnectedProps, NonNullable<Adapter['loadSecrets']>>
  injectSecret?: PoolMethod<
    ConnectedProps,
    NonNullable<AdapterPoolConnectedProps['injectSecret']>
  >
  initEvents: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['initEvents']
  >
  initSecrets: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['initSecrets']
  >
  initFinal: PoolMethod<ConnectedProps, AdapterPoolConnectedProps['initFinal']>
  dropEvents: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['dropEvents']
  >
  dropSecrets: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['dropSecrets']
  >
  dropFinal: PoolMethod<ConnectedProps, AdapterPoolConnectedProps['dropFinal']>
}

export interface Adapter {
  loadEvents: (filter: EventFilter) => Promise<EventsWithCursor>
  importEvents: (options?: Partial<ImportOptions>) => stream.Writable
  exportEvents: (options?: Partial<ExportOptions>) => stream.Readable
  getLatestEvent: (filter: EventFilter) => Promise<any>
  saveEvent: (event: InputEvent) => Promise<void>
  init: () => Promise<void>
  drop: () => Promise<void>
  dispose: () => Promise<void>
  freeze: () => Promise<void>
  unfreeze: () => Promise<void>
  getNextCursor: (prevCursor: string | null, events: any[]) => string
  getSecretsManager: () => Promise<SecretsManager>
  loadSnapshot: (snapshotKey: string) => Promise<any>
  saveSnapshot: (snapshotKey: string, content: string) => Promise<any>
  dropSnapshot: (snapshotKey: string) => Promise<any>
  pushIncrementalImport: (
    events: InputEvent[],
    importId: string
  ) => Promise<void>
  beginIncrementalImport: () => Promise<string>
  commitIncrementalImport: (
    importId: string,
    validateAfterCommit?: any
  ) => Promise<void>
  rollbackIncrementalImport: () => Promise<void>
  incrementalImport: (events: InputEvent[]) => Promise<void>
  loadSecrets?: (filter: SecretFilter) => Promise<SecretsWithIdx>
  importSecrets: (options?: Partial<ImportSecretsOptions>) => stream.Writable
  exportSecrets: (options?: Partial<ExportSecretsOptions>) => stream.Readable
}
