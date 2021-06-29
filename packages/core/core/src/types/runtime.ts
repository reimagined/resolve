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
} from './core'

import { AggregateInterop, AggregateRuntime } from '../aggregate/types'
import { ReadModelRuntime } from '../read-model/types'

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
  time: (name: string, timestamp?: number) => void
  timeEnd: (name: string, timestamp?: number) => void
  publish: () => Promise<void>
  performance?: PerformanceTracer
}

export type Eventstore = {
  saveEvent: (event: any) => Promise<any>
  saveSnapshot: Function
  getNextCursor: (cursor: any, events: Event[]) => Promise<any>
  loadSnapshot: (snapshotKey: string) => Promise<string | null>
  loadEvents: (param: {
    aggregateIds: string[]
    eventTypes?: string[]
    cursor: null
    limit: number
  }) => Promise<{
    events: any[]
  }>
  ensureEventSubscriber: Function
  getEventSubscribers: Function
  removeEventSubscriber: Function
}

export type AggregateMeta = {
  name: string
  commands: Aggregate
  projection: AggregateProjection
  serializeState: Function
  deserializeState: Function
  encryption: AggregateEncryptionFactory | null
  invariantHash?: string
}

export type EventProjectionMeta = {
  name: string
  connectorName: string
  encryption: EventHandlerEncryptionFactory
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

type CommandMiddlewareParameters = [
  ...args: Parameters<CommandHandler>,
  middlewareContext?: AggregateInteropContext
]
type ResolverMiddlewareParameters = [
  ...args: Parameters<ReadModelResolver<any>>,
  middlewareContext?: ReadModelResolverInteropContext
]
type ProjectionMiddlewareParameters = [
  ...args: Parameters<ReadModelEventHandler<any>>,
  middlewareContext?: ReadModelInteropContext
]

type CommandMiddlewareHandler = (
  ...args: CommandMiddlewareParameters
) => ReturnType<CommandHandler>

type ResolverMiddlewareHandler = (
  ...args: ResolverMiddlewareParameters
) => ReturnType<ReadModelResolver<any>>

type ProjectionMiddlewareHandler = (
  ...args: ProjectionMiddlewareParameters
) => ReturnType<ReadModelEventHandler<any>>

type MiddlewareChainableFunction =
  | CommandMiddlewareHandler
  | ResolverMiddlewareHandler
  | ProjectionMiddlewareHandler

type MiddlewareHandler<THandler> = (next: THandler) => THandler

export type ExecutionContext = {
  req?: any
  res?: any
}

type ReadModelInteropContext = {
  meta: ReadModelMeta
  runtime: ReadModelRuntime
} & ExecutionContext

type ReadModelResolverInteropContext = {
  resolver: string
} & ReadModelInteropContext

type AggregateInteropContext = {
  interop: AggregateInterop
  runtime: AggregateRuntime
} & ExecutionContext

type Middleware<
  THandler extends MiddlewareChainableFunction
> = MiddlewareHandler<THandler>

export type MiddlewareWrapper = <THandler extends MiddlewareChainableFunction>(
  middlewares: Array<Middleware<THandler>>
) => MiddlewareApplier<THandler>

export type MiddlewareApplier<T extends MiddlewareChainableFunction> = (
  targetHandler: T
) => T

export type CommandMiddleware = Middleware<CommandMiddlewareHandler>
export type ProjectionMiddleware = Middleware<ProjectionMiddlewareHandler>
export type ResolverMiddleware = Middleware<ResolverMiddlewareHandler>
