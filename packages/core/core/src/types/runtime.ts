import { IS_BUILT_IN } from '../symbols'
import {
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
} from './core'
import { CommandHttpResponseMode } from '../aggregate/types'

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

export type Monitoring = {
  group: (config: Record<string, any>) => Monitoring
  error: (error: Error) => void
  execution: (error?: Error) => void
  duration?: (label: string, duration: number, count?: number) => void
  time: (name: string, timestamp?: number) => void
  timeEnd: (name: string, timestamp?: number) => void
  publish: () => Promise<void>
  rate?: (metricName: string, count: number, seconds?: number) => void
  performance?: PerformanceTracer
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
  req?: any
  res?: any
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
