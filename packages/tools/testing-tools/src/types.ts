import {
  Event,
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  CommandResult,
  SerializableMap,
  EventHandlerEncryptionFactory,
  ReadModelResolvers,
  ReadModel,
  SagaEventHandlers,
  SagaSideEffects,
} from '@resolve-js/core'
import { AggregateTestEnvironment } from './flow/aggregate/make-test-environment'
import { ReadModelTestEnvironment } from './flow/read-model/make-test-environment'
import { SagaTestEnvironment } from './flow/saga/make-test-environment'

export type OmitFirstArgument<F> = F extends (
  first: any,
  ...args: infer Params
) => infer Result
  ? (...args: Params) => Result
  : never

export type TestEvent = Omit<
  Event,
  'timestamp' | 'aggregateId' | 'aggregateVersion'
> & {
  timestamp?: number
  aggregateId?: string
}

export type TestAggregate = {
  name: string
  projection: AggregateProjection
  commands: Aggregate
  encryption?: AggregateEncryptionFactory
}

export type TestAggregateAssertion = (
  resolve: Function,
  reject: Function,
  result: CommandResult | null,
  error: any
) => void

export type TestCommand = {
  name: string
  payload?: SerializableMap
}

export type GivenEventsContext = {
  events: TestEvent[]
}

export type AggregateContext = {
  aggregate: TestAggregate
  aggregateId?: string
} & GivenEventsContext

export type CommandContext = {
  command: TestCommand
  environment: AggregateTestEnvironment
} & AggregateContext

export type AggregateTestResult = {
  type: string
  payload?: SerializableMap
}

export type TestReadModel = {
  name: string
  projection: ReadModel<any>
  resolvers: ReadModelResolvers<any>
  // FIXME: deprecated
  encryption?: EventHandlerEncryptionFactory
  // FIXME: deprecated
  adapter?: any
}

export type TestQuery = {
  resolver: string
  args?: SerializableMap
}

export type QueryTestResult = any

export type ReadModelContext = {
  readModel: TestReadModel
  adapter?: any
  encryption?: EventHandlerEncryptionFactory
} & GivenEventsContext

export type QueryContext = {
  query: TestQuery
  environment: ReadModelTestEnvironment
} & ReadModelContext

export type TestSaga<TSideEffects = any> = {
  name: string
  handlers: SagaEventHandlers<any, SagaSideEffects & TSideEffects>
  sideEffects: TSideEffects
  // FIXME: deprecated
  encryption?: EventHandlerEncryptionFactory
  // FIXME: deprecated
  adapter?: any
}

export type SagaTestResult = {
  commands: any[]
  scheduledCommands: any[]
  // FIXME: deprecated
  scheduleCommands: any[]
  sideEffects: any[]
  queries: any[]
}

export type SagaContext = {
  saga: TestSaga
  adapter?: any
  encryption?: EventHandlerEncryptionFactory
  environment: SagaTestEnvironment
} & GivenEventsContext
