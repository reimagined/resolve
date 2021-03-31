import {
  SecretsManager,
  Event,
  SerializableMap,
  Serializable,
} from '@resolve-js/core'
import stream from 'stream'
import { MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL } from './constants'

import * as t from 'io-ts'
import { isRight } from 'fp-ts/These'
import { either } from 'fp-ts/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'

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

/* eslint-disable @typescript-eslint/no-unused-vars */
export type UnbrandProps<T extends any> = {
  [Property in keyof T]: T[Property] extends
    | t.Branded<infer S, infer B>
    | infer Union
    ? S | Union
    : T[Property]
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export type InputEvent = Omit<Event, 'payload'> & { payload?: Serializable }
export type EventThreadData = {
  threadCounter: number
  threadId: number
}
export type SavedEvent = Event & EventThreadData & SerializableMap

export type CheckForResourceError = (errors: Error[]) => void

type DeleteSecret = SecretsManager['deleteSecret']
type GetSecret = SecretsManager['getSecret']
type SetSecret = SecretsManager['setSecret']

type ShapeEvent = (event: any, additionalFields?: any) => SavedEvent

export type ValidateEventFilter = (filter: EventFilter) => void

export type Cursor = string | null

export type GetNextCursor = (
  prevCursor: Cursor,
  events: EventThreadData[]
) => string

export type EventsWithCursor = {
  cursor: Cursor
  events: SavedEvent[]
}

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

export type SecretFilter = {
  idx?: number | null
  skip?: number
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

export const AdapterConfigSchema = t.partial({
  snapshotBucketSize: t.Int,
})
type AdapterConfigChecked = t.TypeOf<typeof AdapterConfigSchema>
export type AdapterConfig = UnbrandProps<AdapterConfigChecked>

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

  ensureEventSubscriber: (params: {
    applicationName: string
    eventSubscriber: string
    destination?: any
    status?: any
    updateOnly?: boolean
  }) => Promise<boolean>
  removeEventSubscriber: (params: {
    applicationName: string
    eventSubscriber: string
  }) => Promise<void>
  getEventSubscribers: (
    params?:
      | {
          applicationName?: string
          eventSubscriber?: string
        }
      | undefined
  ) => Promise<
    Array<{
      applicationName: string
      eventSubscriber: string
      destination: any
      status: any
    }>
  >
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

export type ImportEventsStream = stream.Writable & {
  readonly byteOffset: number
  readonly savedEventsCount: number
}

export type ExportOptions = {
  cursor: Cursor
  maintenanceMode: MAINTENANCE_MODE
  bufferSize: number
}

export type ExportEventsStream = stream.Readable & {
  readonly cursor: Cursor
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
}

export interface Adapter {
  loadEvents: (filter: EventFilter) => Promise<EventsWithCursor>
  importEvents: (options?: Partial<ImportOptions>) => ImportEventsStream
  exportEvents: (options?: Partial<ExportOptions>) => ExportEventsStream
  getLatestEvent: (filter: EventFilter) => Promise<SavedEvent | null>
  saveEvent: (event: InputEvent) => Promise<void>
  init: () => Promise<void>
  drop: () => Promise<void>
  dispose: () => Promise<void>
  freeze: () => Promise<void>
  unfreeze: () => Promise<void>
  getNextCursor: GetNextCursor
  getSecretsManager: () => Promise<SecretsManager>
  loadSnapshot: (snapshotKey: string) => Promise<string | null>
  saveSnapshot: (snapshotKey: string, content: string) => Promise<void>
  dropSnapshot: (snapshotKey: string) => Promise<void>
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

  ensureEventSubscriber: (params: {
    applicationName: string
    eventSubscriber: string
    destination?: any
    status?: any
    updateOnly?: boolean
  }) => Promise<boolean>
  removeEventSubscriber: (params: {
    applicationName: string
    eventSubscriber: string
  }) => Promise<void>
  getEventSubscribers: (
    params?:
      | {
          applicationName?: string
          eventSubscriber?: string
        }
      | undefined
  ) => Promise<
    Array<{
      applicationName: string
      eventSubscriber: string
      destination: any
      status: any
    }>
  >
}
