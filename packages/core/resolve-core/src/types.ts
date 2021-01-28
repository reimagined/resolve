import { ReadModelResolverMap } from './read-model/types'
import {
  Deserializer,
  ReadModel,
  SagaEventHandlers,
  Serializer,
  ViewModelProjection,
  ViewModelResolver,
} from './core-types'

import {
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  EventHandlerEncryptionFactory,
} from './core-types'

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
  resolvers: ReadModelResolverMap
  projection: ReadModel<any>
}

export type SagaMeta = EventProjectionMeta & {
  sideEffects: any
  handlers: SagaEventHandlers<any, any>
}

export type ViewModelMeta = {
  name: string
  projection: ViewModelProjection<any>
  deserializeState: Deserializer<any>
  serializeState: Serializer<any>
  resolver?: ViewModelResolver
  encryption?: EventHandlerEncryptionFactory
}

export type Monitoring = {
  error?: (error: Error, part: string, meta: any) => Promise<void>
  performance?: PerformanceTracer
}

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
