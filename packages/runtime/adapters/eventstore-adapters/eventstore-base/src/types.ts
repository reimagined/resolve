import type {
  SecretsManager,
  Event,
  StoredEvent,
  EventThreadData,
  SerializableMap,
  StoredEventPointer,
  StoredEventBatchPointer,
  Eventstore as CoreEventstore,
  InputCursor,
  Cursor,
} from '@resolve-js/core'
import stream from 'stream'
import { MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL } from './constants'

import * as t from 'io-ts'
import { isRight } from 'fp-ts/These'
import { either } from 'fp-ts/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import * as iotsTypes from 'io-ts-types'

export type {
  StoredEvent,
  EventThreadData,
  StoredEventPointer,
  StoredEventBatchPointer,
  InputCursor,
  Cursor,
}

export function validate<T extends t.Type<any>>(
  schema: T,
  params: any,
  errorName?: string
): t.TypeOf<T> {
  const validationResult = schema.decode(params)
  if (!isRight(validationResult)) {
    const messages = PathReporter.report(validationResult)
    const error = new Error(messages.join('\r\n'))
    if (errorName != null) {
      error.name = errorName
    }
    throw error
  }
  return params
}

type DefinedType<T extends any> = undefined extends Extract<T, undefined>
  ? Exclude<T, undefined>
  : T

/* eslint-disable @typescript-eslint/no-unused-vars */
export type UnbrandProps<T extends any> = {
  [Property in keyof T]: DefinedType<T[Property]> extends string &
    t.Brand<infer B>
    ? string | Extract<T[Property], undefined>
    : DefinedType<T[Property]> extends t.Branded<infer S, infer B>
    ? S | Extract<T[Property], undefined>
    : T[Property]
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export type InputEvent = Event
export type VersionlessEvent = Omit<InputEvent, 'aggregateVersion'>
export type OldEvent = InputEvent

export type ReplicationStatus =
  | 'batchInProgress'
  | 'batchDone'
  | 'error'
  | 'notStarted'
  | 'serviceError'
export type ReplicationState = {
  status: ReplicationStatus
  statusData: SerializableMap | null
  paused: boolean
  iterator: SerializableMap | null
  successEvent: OldEvent | null
}

export function getInitialReplicationState(): ReplicationState {
  return {
    status: 'notStarted',
    statusData: null,
    iterator: null,
    paused: false,
    successEvent: null,
  }
}

export type EventStoreDescription = {
  eventCount: number
  secretCount: number
  setSecretCount: number
  deletedSecretCount: number
  isFrozen: boolean
  lastEventTimestamp: number
  cursor?: Cursor
  resourceNames?: { [key: string]: string }
}

export type CheckForResourceError = (errors: Error[]) => void

type DeleteSecret = SecretsManager['deleteSecret']
type GetSecret = SecretsManager['getSecret']
type SetSecret = SecretsManager['setSecret']

type ShapeEvent = (event: any, additionalFields?: any) => StoredEvent

export type ValidateEventFilter = (filter: EventFilter) => void

const EventFilterCommonSchema = t.intersection([
  t.type({
    limit: t.Int,
  }),
  t.partial({
    eventTypes: t.union([t.array(t.string), t.null]),
    aggregateIds: t.union([t.array(t.string), t.null]),
    eventsSizeLimit: t.Int,
  }),
])

const TimestampFilterFieldsSchema = t.partial({
  startTime: t.Int,
  finishTime: t.Int,
})
const TimestampFilterSchema = t.intersection([
  EventFilterCommonSchema,
  TimestampFilterFieldsSchema,
])
type TimestampFilterChecked = t.TypeOf<typeof TimestampFilterSchema>
export type TimestampFilter = UnbrandProps<TimestampFilterChecked>

const CursorFilterFieldsSchema = t.type({
  cursor: t.union([t.string, t.null]),
})
const CursorFilterSchema = t.intersection([
  EventFilterCommonSchema,
  CursorFilterFieldsSchema,
])
type CursorFilterChecked = t.TypeOf<typeof CursorFilterSchema>
export type CursorFilter = UnbrandProps<CursorFilterChecked>

const EventFilterSchemaSimple = t.intersection([
  EventFilterCommonSchema,
  TimestampFilterFieldsSchema,
  t.partial(CursorFilterFieldsSchema.props),
])

export const EventFilterSchema = new t.Type<EventFilter, EventFilter>(
  'EventFilterSchema',
  EventFilterSchemaSimple.is,
  (u, c) =>
    either.chain(EventFilterSchemaSimple.validate(u, c), (filter) => {
      if (isCursorFilter(filter)) {
        if (isTimestampFilter(filter)) {
          return t.failure(
            u,
            c,
            'startTime and finishTime are not allowed in cursor filter'
          )
        }
        return t.success(filter)
      } else if (isTimestampFilter(filter)) {
        if (filter.startTime !== undefined && filter.finishTime !== undefined) {
          if (filter.startTime > filter.finishTime) {
            return t.failure(
              u,
              c,
              `Event filter start time cannot be later than finishTime`
            )
          }
        }
        return t.success(filter)
      } else {
        return t.failure(
          u,
          c,
          'Cursor or at least one of startTime or finishTime should be defined'
        )
      }
    }),
  t.identity
)
type EventFilterChecked = t.TypeOf<typeof EventFilterSchemaSimple>
export type EventFilter = UnbrandProps<EventFilterChecked>
export type LatestEventFilter = Omit<EventFilter, 'limit' | 'eventsSizeLimit'>

export type SecretFilter = {
  idx?: SecretRecord['idx'] | null
  skip?: number
  limit: number
  ids?: Array<SecretRecord['id']> | null
  includeDeleted?: boolean
}

export type SecretsWithIdx = {
  idx: SecretRecord['idx'] | null
  secrets: SecretRecord[]
}

export type SecretRecord = {
  idx: number
  id: string
  secret: string | null
}

export type GatheredSecrets = {
  existingSecrets: SecretRecord[]
  deletedSecrets: Array<SecretRecord['id']>
}

export type OldSecretRecord = SecretRecord

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

export const AdapterConfigSchema = t.partial({
  snapshotBucketSize: t.Int,
})
type AdapterConfigChecked = t.TypeOf<typeof AdapterConfigSchema>
export type AdapterConfig = UnbrandProps<AdapterConfigChecked>

export const AdapterTableNamesSchema = t.partial({
  secretsTableName: iotsTypes.NonEmptyString,
  eventsTableName: iotsTypes.NonEmptyString,
  snapshotsTableName: iotsTypes.NonEmptyString,
  subscribersTableName: iotsTypes.NonEmptyString,
})
type AdapterTableNamesChecked = t.TypeOf<typeof AdapterTableNamesSchema>
export type AdapterTableNames = UnbrandProps<AdapterTableNamesChecked>
export type AdapterTableNamesProps = Required<AdapterTableNames>

export type AdapterPoolPrimalProps = {
  disposed: boolean
  validateEventFilter: ValidateEventFilter

  isConnected: boolean
  createGetConnectPromise: () => () => Promise<void>
  getConnectPromise: () => Promise<void>

  maybeThrowResourceError: CheckForResourceError
  bucketSize: number
  counters: Map<string, number>

  getNextCursor: CoreEventstore['getNextCursor']
  getVacantTimeInMillis?: () => number
}

export type AdapterPoolPrivateConnectedProps = {
  injectEvent: (event: StoredEvent) => Promise<void>
  injectEvents: (events: StoredEvent[]) => Promise<void>
  injectSecret?: (secretRecord: SecretRecord) => Promise<void>

  loadEventsByTimestamp: (filter: TimestampFilter) => Promise<StoredEventBatchPointer>
  loadEventsByCursor: (filter: CursorFilter) => Promise<StoredEventBatchPointer>

  deleteSecret: DeleteSecret
  getSecret: GetSecret
  setSecret: SetSecret

  waitConnect: () => Promise<void>
  shapeEvent: ShapeEvent

  initEvents: () => Promise<any[]>
  initSecrets: () => Promise<any[]>
  initFinal: () => Promise<any[]>
  dropEvents: () => Promise<any[]>
  dropSecrets: () => Promise<any[]>
  dropFinal: () => Promise<any[]>
}

export type AdapterPoolConnectedProps = Adapter &
  AdapterPoolPrivateConnectedProps

export type AdapterPoolPossiblyUnconnected<
  ConnectedProps extends AdapterPoolConnectedProps
> = AdapterPoolPrimalProps & Partial<ConnectedProps>

export type AdapterPoolConnected<
  ConnectedProps extends AdapterPoolConnectedProps
> = AdapterPoolPrimalProps & ConnectedProps

export type MAINTENANCE_MODE =
  | typeof MAINTENANCE_MODE_AUTO
  | typeof MAINTENANCE_MODE_MANUAL

export type ImportOptions = {
  byteOffset: number
  maintenanceMode: MAINTENANCE_MODE
}

export type ImportEventsStream = stream.Writable & {
  readonly byteOffset: number
  readonly savedEventsCount: number
}

export type ExportOptions = {
  cursor: InputCursor
  maintenanceMode: MAINTENANCE_MODE
  bufferSize: number
}

export type ExportEventsStream = stream.Readable & {
  readonly cursor: InputCursor
  readonly isBufferOverflow: boolean
  readonly isEnd: boolean
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
  getNextCursor: CoreEventstore['getNextCursor']
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
  gatherSecretsFromEvents: PoolMethod<
    ConnectedProps,
    Adapter['gatherSecretsFromEvents']
  >
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
  injectEvents: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['injectEvents']
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
  loadSecrets?: PoolMethod<ConnectedProps, Adapter['loadSecrets']>
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

  ensureEventSubscriber: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['ensureEventSubscriber']
  >

  removeEventSubscriber: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['removeEventSubscriber']
  >

  getEventSubscribers: PoolMethod<
    ConnectedProps,
    AdapterPoolConnectedProps['getEventSubscribers']
  >

  replicateEvents?: PoolMethod<ConnectedProps, Adapter['replicateEvents']>
  replicateSecrets?: PoolMethod<ConnectedProps, Adapter['replicateSecrets']>

  setReplicationStatus?: PoolMethod<
    ConnectedProps,
    Adapter['setReplicationStatus']
  >
  setReplicationIterator?: PoolMethod<
    ConnectedProps,
    Adapter['setReplicationIterator']
  >
  setReplicationPaused?: PoolMethod<
    ConnectedProps,
    Adapter['setReplicationPaused']
  >
  getReplicationState?: PoolMethod<
    ConnectedProps,
    Adapter['getReplicationState']
  >
  resetReplication?: PoolMethod<ConnectedProps, Adapter['resetReplication']>

  getCursorUntilEventTypes?: PoolMethod<
    ConnectedProps,
    Adapter['getCursorUntilEventTypes']
  >
  describe: PoolMethod<ConnectedProps, Adapter['describe']>
  establishTimeLimit?: UnconnectedPoolMethod<
    ConnectedProps,
    Adapter['establishTimeLimit']
  >
}

export interface Adapter extends CoreEventstore {
  importEvents: (options?: Partial<ImportOptions>) => ImportEventsStream
  exportEvents: (options?: Partial<ExportOptions>) => ExportEventsStream
  getLatestEvent: (filter: LatestEventFilter) => Promise<StoredEvent | null>
  init: () => Promise<void>
  drop: () => Promise<void>
  dispose: () => Promise<void>
  freeze: () => Promise<void>
  unfreeze: () => Promise<void>
  getSecretsManager: () => Promise<SecretsManager>
  dropSnapshot: (snapshotKey: string) => Promise<void>
  pushIncrementalImport: (
    events: VersionlessEvent[],
    importId: string
  ) => Promise<void>
  beginIncrementalImport: () => Promise<string>
  commitIncrementalImport: (
    importId: string,
    validateAfterCommit?: any
  ) => Promise<void>
  rollbackIncrementalImport: () => Promise<void>
  incrementalImport: (events: VersionlessEvent[]) => Promise<void>
  loadSecrets: (filter: SecretFilter) => Promise<SecretsWithIdx>
  importSecrets: (options?: Partial<ImportSecretsOptions>) => stream.Writable
  exportSecrets: (options?: Partial<ExportSecretsOptions>) => stream.Readable

  gatherSecretsFromEvents: (events: StoredEvent[]) => Promise<GatheredSecrets>

  replicateEvents: (events: OldEvent[]) => Promise<void>
  replicateSecrets: (
    existingSecrets: OldSecretRecord[],
    deletedSecrets: Array<OldSecretRecord['id']>
  ) => Promise<void>
  setReplicationIterator: (iterator: SerializableMap) => Promise<void>
  setReplicationStatus: (
    status: ReplicationStatus,
    info?: ReplicationState['statusData'],
    lastEvent?: OldEvent
  ) => Promise<void>
  setReplicationPaused: (pause: boolean) => Promise<void>
  getReplicationState: () => Promise<ReplicationState>
  resetReplication: () => Promise<void>

  getCursorUntilEventTypes: (
    cursor: InputCursor,
    untilEventTypes: Array<InputEvent['type']>
  ) => Promise<string>

  describe: () => Promise<EventStoreDescription>
  establishTimeLimit: (getVacantTimeInMillis: () => number) => void
}
