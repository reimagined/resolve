import {
  Event,
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  SerializableMap,
  EventHandlerEncryptionFactory,
  ReadModelResolvers,
  ReadModel,
  SagaEventHandlers,
  SagaSideEffects,
  ReadModelQueryResult,
  Command,
  ReadModelQuery,
  CommandResult,
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

export type TestAssertion<TResult> = (
  resolve: (result: TResult) => void,
  reject: (error: Error) => void,
  result: TResult,
  error: any,
  negated: boolean
) => void

export type TestAggregate = {
  name: string
  projection: AggregateProjection
  commands: Aggregate
  encryption?: AggregateEncryptionFactory
}

export type TestCommand = {
  name: string
  payload?: SerializableMap
}

export type CommandTestResult = {
  type: string
  payload?: SerializableMap
} | null

export type TestCommandAssertion = TestAssertion<CommandTestResult>

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

export type TestReadModel = {
  name: string
  projection: ReadModel<any>
  resolvers: ReadModelResolvers<any>
}

export type TestQuery = {
  resolver: string
  args?: SerializableMap
}

export type QueryTestResult = ReadModelQueryResult

export type TestQueryAssertion = TestAssertion<QueryTestResult>

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
}

export type TestSagaAssertion = TestAssertion<SagaTestResult>

export type ScheduledCommand = {
  date: number
  command: Command
}

export type ExecutedSideEffect = [string, ...any[]]

export type SagaTestResult = {
  commands: Array<Command>
  scheduledCommands: Array<ScheduledCommand>
  sideEffects: Array<ExecutedSideEffect>
  queries: Array<ReadModelQuery>
}

export type SagaContext = {
  saga: TestSaga
  adapter?: any
  encryption?: EventHandlerEncryptionFactory
  environment: SagaTestEnvironment
} & GivenEventsContext

export type MockedCommandImplementation = (command: Command) => CommandResult
export type MockedQueryImplementation = (
  query: ReadModelQuery
) => ReadModelQueryResult
