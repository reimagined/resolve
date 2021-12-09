import type {
  SecretsManager,
  Event,
  StoredEvent,
  EventThreadData,
  StoredEventPointer,
  StoredEventBatchPointer,
  Eventstore as CoreEventstore,
  InputCursor,
  Cursor,
  SecretRecord,
  OldSecretRecord,
  OldEvent,
  ReplicationState,
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

export type { SecretRecord, OldSecretRecord, OldEvent }

export type { ReplicationState }

export function getInitialReplicationState(): ReplicationState {
  return {
    statusAndData: {
      status: 'notStarted',
      data: null,
    },
    iterator: null,
    paused: false,
    successEvent: null,
    locked: false,
    lockId: null,
  }
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
export type LatestEventFilter = Pick<EventFilter, 'aggregateIds' | 'eventTypes'>

export type EventLoaderFilter = Omit<CursorFilter, 'limit' | 'eventsSizeLimit'>

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

export type GatheredSecrets = {
  existingSecrets: SecretRecord[]
  deletedSecrets: Array<SecretRecord['id']>
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
  ConfiguredProps extends {},
  M extends (...args: any) => any
> = (
  pool: AdapterBoundPool<ConfiguredProps>,
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

  maybeThrowResourceError: CheckForResourceError
  bucketSize: number
  counters: Map<string, number>

  getNextCursor: CoreEventstore['getNextCursor']
}

export type AdapterPoolBoundProps = Adapter & AdapterPoolPrivateBoundProps

export type AdapterPrimalPool<
  ConfiguredProps extends {}
> = AdapterPoolPrimalProps &
  Partial<ConfiguredProps> &
  Partial<AdapterPoolBoundProps>

export type AdapterConfiguredPool<
  ConfiguredProps extends {}
> = AdapterPoolPrimalProps & ConfiguredProps & Partial<AdapterPoolBoundProps>

export type AdapterBoundPool<
  ConfiguredProps extends {}
> = AdapterPoolPrimalProps & ConfiguredProps & AdapterPoolBoundProps

export type AdapterPoolPrivateBoundProps = {
  injectEvent: (event: StoredEvent) => Promise<void>
  injectEvents: (events: StoredEvent[]) => Promise<void>
  injectSecret: (secretRecord: SecretRecord) => Promise<void>

  loadEventsByTimestamp: (
    filter: TimestampFilter
  ) => Promise<StoredEventBatchPointer>
  loadEventsByCursor: (filter: CursorFilter) => Promise<StoredEventBatchPointer>

  deleteSecret: DeleteSecret
  getSecret: GetSecret
  setSecret: SetSecret

  shapeEvent: ShapeEvent

  initEvents: () => Promise<any[]>
  initSecrets: () => Promise<any[]>
  initFinal: () => Promise<any[]>
  dropEvents: () => Promise<any[]>
  dropSecrets: () => Promise<any[]>
  dropFinal: () => Promise<any[]>

  getEventLoaderNative?: (filter: EventLoaderFilter) => Promise<EventLoader>
}

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

export interface CommonAdapterFunctions<ConfiguredProps extends {}> {
  maybeThrowResourceError: CheckForResourceError
  validateEventFilter: ValidateEventFilter
  loadEvents: PoolMethod<ConfiguredProps, Adapter['loadEvents']>
  importEventsStream: PoolMethod<ConfiguredProps, Adapter['importEvents']>
  exportEventsStream: PoolMethod<ConfiguredProps, Adapter['exportEvents']>
  incrementalImport: PoolMethod<ConfiguredProps, Adapter['incrementalImport']>
  getNextCursor: CoreEventstore['getNextCursor']
  importSecretsStream: PoolMethod<ConfiguredProps, Adapter['importSecrets']>
  exportSecretsStream: PoolMethod<ConfiguredProps, Adapter['exportSecrets']>
  init: PoolMethod<ConfiguredProps, Adapter['init']>
  drop: PoolMethod<ConfiguredProps, Adapter['drop']>
  gatherSecretsFromEvents: PoolMethod<
    ConfiguredProps,
    Adapter['gatherSecretsFromEvents']
  >

  getEventLoader: PoolMethod<ConfiguredProps, Adapter['getEventLoader']>
}

export interface AdapterFunctions<ConfiguredProps extends {}> {
  beginIncrementalImport?: PoolMethod<
    ConfiguredProps,
    Adapter['beginIncrementalImport']
  >
  commitIncrementalImport?: PoolMethod<
    ConfiguredProps,
    Adapter['commitIncrementalImport']
  >
  dispose: PoolMethod<ConfiguredProps, Adapter['dispose']>
  dropSnapshot?: PoolMethod<ConfiguredProps, Adapter['dropSnapshot']>
  freeze: PoolMethod<ConfiguredProps, Adapter['freeze']>
  getLatestEvent?: PoolMethod<ConfiguredProps, Adapter['getLatestEvent']>
  injectEvent?: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['injectEvent']
  >
  injectEvents: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['injectEvents']
  >
  loadEventsByCursor: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['loadEventsByCursor']
  >
  loadEventsByTimestamp: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['loadEventsByTimestamp']
  >
  loadSnapshot?: PoolMethod<ConfiguredProps, Adapter['loadSnapshot']>
  pushIncrementalImport?: PoolMethod<
    ConfiguredProps,
    Adapter['pushIncrementalImport']
  >
  rollbackIncrementalImport?: PoolMethod<
    ConfiguredProps,
    Adapter['rollbackIncrementalImport']
  >
  saveEvent: PoolMethod<ConfiguredProps, Adapter['saveEvent']>
  saveSnapshot?: PoolMethod<ConfiguredProps, Adapter['saveSnapshot']>
  shapeEvent: ShapeEvent
  unfreeze: PoolMethod<ConfiguredProps, Adapter['unfreeze']>
  getSecret: PoolMethod<ConfiguredProps, GetSecret>
  setSecret: PoolMethod<ConfiguredProps, SetSecret>
  deleteSecret: PoolMethod<ConfiguredProps, DeleteSecret>
  loadSecrets?: PoolMethod<ConfiguredProps, Adapter['loadSecrets']>
  injectSecret?: PoolMethod<
    ConfiguredProps,
    NonNullable<AdapterPoolBoundProps['injectSecret']>
  >
  initEvents: PoolMethod<ConfiguredProps, AdapterPoolBoundProps['initEvents']>
  initSecrets: PoolMethod<ConfiguredProps, AdapterPoolBoundProps['initSecrets']>
  initFinal: PoolMethod<ConfiguredProps, AdapterPoolBoundProps['initFinal']>
  dropEvents: PoolMethod<ConfiguredProps, AdapterPoolBoundProps['dropEvents']>
  dropSecrets: PoolMethod<ConfiguredProps, AdapterPoolBoundProps['dropSecrets']>
  dropFinal: PoolMethod<ConfiguredProps, AdapterPoolBoundProps['dropFinal']>

  ensureEventSubscriber: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['ensureEventSubscriber']
  >

  removeEventSubscriber: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['removeEventSubscriber']
  >

  getEventSubscribers: PoolMethod<
    ConfiguredProps,
    AdapterPoolBoundProps['getEventSubscribers']
  >

  replicateEvents?: PoolMethod<ConfiguredProps, Adapter['replicateEvents']>
  replicateSecrets?: PoolMethod<ConfiguredProps, Adapter['replicateSecrets']>

  setReplicationStatus?: PoolMethod<
    ConfiguredProps,
    Adapter['setReplicationStatus']
  >
  setReplicationPaused?: PoolMethod<
    ConfiguredProps,
    Adapter['setReplicationPaused']
  >
  getReplicationState?: PoolMethod<
    ConfiguredProps,
    Adapter['getReplicationState']
  >
  resetReplication?: PoolMethod<ConfiguredProps, Adapter['resetReplication']>
  setReplicationLock?: PoolMethod<
    ConfiguredProps,
    Adapter['setReplicationLock']
  >

  getCursorUntilEventTypes?: PoolMethod<
    ConfiguredProps,
    Adapter['getCursorUntilEventTypes']
  >
  describe: PoolMethod<ConfiguredProps, Adapter['describe']>
  establishTimeLimit?: PoolMethod<
    ConfiguredProps,
    Adapter['establishTimeLimit']
  >

  getEventLoaderNative?: PoolMethod<
    ConfiguredProps,
    NonNullable<AdapterPoolBoundProps['getEventLoaderNative']>
  >
}

export interface EventLoader {
  readonly loadEvents: (limit: number) => Promise<StoredEventBatchPointer>
  readonly close: () => Promise<void>
  readonly cursor: InputCursor
  readonly isNative: boolean
}

export type EventLoaderOptions = {
  preferRegular: boolean // prefer regular implementation via loadEvents over native one
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
  getSecretsManager: () => SecretsManager
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

  getCursorUntilEventTypes: (
    cursor: InputCursor,
    untilEventTypes: Array<InputEvent['type']>
  ) => Promise<string>

  establishTimeLimit: (getVacantTimeInMillis: () => number) => void

  getEventLoader: (
    filter: EventLoaderFilter,
    options?: EventLoaderOptions
  ) => Promise<EventLoader>
}
