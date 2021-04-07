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
  ReadModelResolvers, Command
} from './core'

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

export type Eventstore = {
  saveEvent: (event: any) => Promise<void>
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

type MonitoringCommandPart = 'command'
type MonitoringReadModelProjectionPart = 'readModelProjection'
type MonitoringReadModelResolverPart = 'readModelResolver'
type MonitoringViewModelProjectionPart = 'viewModelProjection'
type MonitoringViewModelResolverPart = 'viewModelResolver'

type MonitoringCommandPartMeta = {
  command: Command
}
type MonitoringProjectionPartMeta = {
  readModelName: string
  eventType: string
}
type MonitoringReadModelResolverPartMeta = {
  readModelName: string
  resolverName: string
}
type MonitoringViewModelProjectionMeta = {
  name: string
  eventType: string
}
type MonitoringViewModelResolverMeta = {
  name: string
}

export interface MonitoringErrorHandler {
  (
    error: Error,
    part: MonitoringCommandPart,
    meta: MonitoringCommandPartMeta
  ): Promise<void>
  (
    error: Error,
    part: MonitoringReadModelProjectionPart,
    meta: MonitoringProjectionPartMeta
  ): Promise<void>
  (
    error: Error,
    part: MonitoringReadModelResolverPart,
    meta: MonitoringReadModelResolverPartMeta
  ): Promise<void>
  (
    error: Error,
    part: MonitoringViewModelProjectionPart,
    meta: MonitoringViewModelProjectionMeta
  ): Promise<void>
  (
    error: Error,
    part: MonitoringViewModelResolverPart,
    meta: MonitoringViewModelResolverMeta
  ): Promise<void>
}

export type Monitoring = {
  error?: MonitoringErrorHandler
  performance?: PerformanceTracer
}
