import { IS_BUILT_IN } from '../symbols'
import type {
  Event,
  Deserializer,
  ReadModel,
  SagaEventHandlers,
  ViewModelProjection,
  ViewModelResolver,
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  EventHandlerEncryptionFactory,
  ReadModelResolvers,
  CommandHandler,
  ReadModelResolver,
  ReadModelEventHandler,
  CommandContext,
  ReadModelResolverContext,
  ReadModelHandlerContext,
  SerializableMap,
  Command,
  CommandResult,
} from './core'
import { CommandHttpResponseMode } from '../aggregate/types'
import type { IncomingHttpHeaders } from 'http'
import type { CookieSerializeOptions } from 'cookie'

export type PerformanceSubsegment = {
  addAnnotation: (name: string, data: any) => void
  addError: (error: Error) => void
  close: () => void
}
export type PerformanceSegment = {
  addNewSubsegment: (name: string) => PerformanceSubsegment
}

export type PerformanceTracer = {
  getSegment: () => PerformanceSegment
}

export interface MonitoringDimension {
  name: string
  value: string
}

export interface MonitoringMetric {
  metricName: string
  dimensions: MonitoringDimension[]
  timestamp: number | null
  values: number[]
  counts: number[]
  unit: string
}

export interface MonitoringData {
  metrics: MonitoringMetric[]
}

export interface MonitoringCustomMetric {
  metricName: string
  unit: string
  dimensions?: MonitoringDimension[]
  value?: number
  count?: number
}

interface MonitoringBase {
  error: (error: Error) => void
  execution: (error?: Error) => void
  duration: (label: string, duration: number, count?: number) => void
  time: (name: string, timestamp?: number) => void
  timeEnd: (name: string, timestamp?: number) => void
  publish: (options?: { source: string }) => Promise<void>
  rate: (metricName: string, count: number, seconds?: number) => void
  custom: (metricData: MonitoringCustomMetric) => void
  performance?: PerformanceTracer
}

export interface MonitoringAdapter extends MonitoringBase {
  group: (config: Record<string, any>) => MonitoringAdapter
  getMetrics: () => MonitoringData
  clearMetrics: () => void
}

export interface Monitoring extends MonitoringBase {
  group: (config: Record<string, any>) => Monitoring
  getMetrics: (id: string) => MonitoringData
  clearMetrics: (id: string) => void
}

export type EventThreadData = {
  threadCounter: number
  threadId: number
}

export type StoredEvent = Event & EventThreadData

export type Cursor = string
export type InputCursor = string | null

export type EventPointer = {
  event: Event
  cursor: Cursor
}

export type StoredEventPointer = {
  cursor: Cursor
  event: StoredEvent
}

export type StoredEventBatchPointer = {
  cursor: Cursor
  events: StoredEvent[]
}

type EventLimitFilter = {
  limit: number
  eventsSizeLimit?: number
}
type EventTypeFilter = {
  aggregateIds?: string[] | null
  eventTypes?: string[] | null
}
type EventTimestampFilter = {
  startTime?: number
  finishTime?: number
}
type EventCursorFilter = {
  cursor?: InputCursor
}

export type EventFilter = EventLimitFilter &
  EventTypeFilter &
  EventTimestampFilter &
  EventCursorFilter

export type SecretRecord = {
  idx: number
  id: string
  secret: string | null
}

export type OldSecretRecord = SecretRecord
export type OldEvent = Event

export type ReplicationStatusAndData =
  | {
      status: 'notStarted'
      data: null
    }
  | {
      status: 'batchInProgress'
      data: {
        startedAt: number
      }
    }
  | {
      status: 'batchDone'
      data: {
        appliedEventsCount: number
      }
    }
  | {
      status: 'criticalError'
      data: {
        name: string
        message: string
      }
    }
  | {
      status: 'serviceError'
      data: {
        name: string
        message: string
      }
    }

export type ReplicationState = {
  statusAndData: ReplicationStatusAndData
  paused: boolean
  iterator: SerializableMap | null
  successEvent: OldEvent | null
  locked: boolean
  lockId: string | null
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

export type EventStoreDescribeOptions = {
  estimateCounts?: boolean
  calculateCursor?: boolean
}

export type Eventstore = {
  saveEvent: (event: Event) => Promise<StoredEventPointer>
  saveSnapshot: (snapshotKey: string, content: string) => Promise<void>
  getNextCursor: (cursor: InputCursor, events: EventThreadData[]) => string
  loadSnapshot: (snapshotKey: string) => Promise<string | null>
  loadEvents: (filter: EventFilter) => Promise<StoredEventBatchPointer>

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

  replicateEvents: (lockId: string, events: OldEvent[]) => Promise<boolean>
  replicateSecrets: (
    lockId: string,
    existingSecrets: OldSecretRecord[],
    deletedSecrets: Array<OldSecretRecord['id']>
  ) => Promise<boolean>
  setReplicationStatus: (
    lockId: string,
    state: {
      statusAndData: ReplicationStatusAndData
      lastEvent?: OldEvent
      iterator?: ReplicationState['iterator']
    }
  ) => Promise<ReplicationState | null>
  setReplicationPaused: (pause: boolean) => Promise<void>
  getReplicationState: () => Promise<ReplicationState>
  resetReplication: () => Promise<void>
  setReplicationLock: (lockId: string, lockDuration: number) => Promise<boolean>

  describe: (
    options?: EventStoreDescribeOptions
  ) => Promise<EventStoreDescription>
}

export type AggregateMeta = {
  name: string
  commands: Aggregate
  projection: AggregateProjection
  serializeState: Function
  deserializeState: Function
  encryption: AggregateEncryptionFactory | null
  invariantHash?: string
  commandHttpResponseMode?: CommandHttpResponseMode
}

export type EventProjectionMeta = {
  name: string
  connectorName: string
  encryption: EventHandlerEncryptionFactory
  invariantHash?: any
}

export type ReadModelMeta = EventProjectionMeta & {
  resolvers: ReadModelResolvers<any>
  projection: ReadModel<any>
}

export type SagaMeta = EventProjectionMeta & {
  sideEffects: any
  handlers: SagaEventHandlers<any, any>
}

export type ViewModelSerializer = (result: any, jwt?: string) => string

export type ViewModelMeta = {
  name: string
  projection: ViewModelProjection<any>
  deserializeState: Deserializer<any>
  serializeState: ViewModelSerializer & { [IS_BUILT_IN]: boolean }
  resolver: ViewModelResolver
  encryption: EventHandlerEncryptionFactory
  invariantHash: string
}

export type Uploader = {
  getSignedPut: (
    dir: string
  ) => Promise<{ uploadUrl: string; uploadId: string }>
  getSignedPost: (dir: string) => Promise<{ form: any; uploadId: string }>
  uploadPut: (uploadUrl: string, filePath: string) => Promise<void>
  uploadPost: (form: { url: string }, filePath: string) => Promise<void>
  createToken: (options: { dir: string; expireTime: number }) => string
}

export type BuildTimeConstants = {
  applicationName: string
  distDir: string
  jwtCookie: {
    name: string
    maxAge: number
  }
  rootPath: string
  staticDir: string
  staticPath: string
  staticRoutes?: string[] | undefined
}

export type QueryExecutor = {
  (...args: any[]): Promise<any>
  [key: string]: (...args: any[]) => Promise<any>
}

export type SagaExecutor = QueryExecutor & {
  build: (...args: any[]) => Promise<any>
}

export type CommandExecutor = {
  (command: Command, context?: MiddlewareContext): Promise<CommandResult>
}

export type UserBackendResolve = Readonly<
  {
    uploader: Uploader | null
    eventstoreAdapter: Eventstore
    performanceTracer: PerformanceTracer
    executeCommand: CommandExecutor
    executeQuery: QueryExecutor
    executeSaga: SagaExecutor
    seedClientEnvs: any
    broadcastEvent: (event?: EventPointer) => Promise<void>
    serverImports: { [key: string]: any }
  } & BuildTimeConstants
>

export type HttpRequest = {
  readonly adapter: string
  readonly method: string
  readonly query: Record<string, any>
  readonly path: string
  readonly headers: IncomingHttpHeaders
  readonly cookies: Record<string, string>
  readonly body: string | null
  jwt?: string
  readonly isLambdaEdgeRequest?: boolean
  readonly clientIp?: string
}

export type ResolveRequest = HttpRequest & {
  readonly resolve: UserBackendResolve
}

export type HttpResponse = {
  readonly cookie: (
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ) => HttpResponse
  readonly clearCookie: (
    name: string,
    options?: CookieSerializeOptions
  ) => HttpResponse
  readonly status: (code: number) => HttpResponse
  readonly redirect: (path: string, code?: number) => HttpResponse
  readonly getHeader: (searchKey: string) => any
  readonly setHeader: (key: string, value: string) => HttpResponse
  readonly text: (content: string, encoding?: BufferEncoding) => HttpResponse
  readonly json: (content: any) => HttpResponse
  readonly end: (
    content?: string | Buffer,
    encoding?: BufferEncoding
  ) => HttpResponse
  readonly file: (
    content: string | Buffer,
    filename: string,
    encoding?: BufferEncoding
  ) => HttpResponse
}

export type ResolveResponse = HttpResponse

//Middleware

export type CommandMiddlewareHandler<
  TContext extends CommandContext = CommandContext
> = (
  middlewareContext: AggregateMiddlewareContext,
  ...args: Parameters<CommandHandler<TContext>>
) => ReturnType<CommandHandler<TContext>>

export type ResolverMiddlewareHandler<
  TContext extends ReadModelResolverContext = ReadModelResolverContext
> = (
  middlewareContext: ReadModelResolverMiddlewareContext,
  ...args: Parameters<ReadModelResolver<any, TContext>>
) => ReturnType<ReadModelResolver<any, TContext>>

export type ProjectionMiddlewareHandler<
  TContext extends ReadModelHandlerContext = ReadModelHandlerContext
> = (
  middlewareContext: ReadModelMiddlewareContext,
  ...args: Parameters<ReadModelEventHandler<any, TContext>>
) => ReturnType<ReadModelEventHandler<any, TContext>>

type MiddlewareChainableFunction =
  | CommandMiddlewareHandler
  | ResolverMiddlewareHandler
  | ProjectionMiddlewareHandler

type MiddlewareHandler<THandler> = (next: THandler) => THandler

export type MiddlewareContext = {
  req?: ResolveRequest
  res?: ResolveResponse
}

type ReadModelMiddlewareContext = {
  readModelName: string
} & MiddlewareContext

type ReadModelResolverMiddlewareContext = {
  resolverName: string
} & ReadModelMiddlewareContext

type AggregateMiddlewareContext = MiddlewareContext

type Middleware<THandler> = MiddlewareHandler<THandler>

export type MiddlewareWrapper = <THandler extends MiddlewareChainableFunction>(
  middlewares: Array<Middleware<THandler>>
) => MiddlewareApplier<THandler>

export type MiddlewareApplier<T extends MiddlewareChainableFunction> = (
  targetHandler: T
) => T

export type ReadModelProjectionMiddleware<
  TContext extends ReadModelHandlerContext = ReadModelHandlerContext
> = Middleware<ProjectionMiddlewareHandler<TContext>>

export type ReadModelResolverMiddleware<
  TContext extends ReadModelResolverContext = ReadModelResolverContext
> = Middleware<ResolverMiddlewareHandler<TContext>>

export type CommandMiddleware<
  TContext extends CommandContext = CommandContext
> = Middleware<CommandMiddlewareHandler<TContext>>

export type ApiHandlerMeta = {
  path: string
  method: string
  handler: (req: ResolveRequest, res: ResolveResponse) => Promise<void>
}
