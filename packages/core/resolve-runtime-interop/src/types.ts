import { ReadModelEventHandler, ReadModelResolverMap } from './read-model/types'

import {
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  ReadModelEncryptionFactory,
} from 'resolve-core'

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
  encryption: ReadModelEncryptionFactory
}

export type ReadModelMeta = EventProjectionMeta & {
  resolvers: ReadModelResolverMap
  projection: { [key: string]: ReadModelEventHandler }
}

export type SagaMeta = EventProjectionMeta & {
  sideEffects: any
  handlers: { [key: string]: Function }
}
