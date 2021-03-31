import {
  Event,
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  CommandResult,
  SerializableMap,
  Serializable,
  EventHandlerEncryptionFactory,
} from '@resolve-js/core'
import { AggregateTestEnvironment } from './flow/aggregate/make-test-environment'
import { ReadModelTestEnvironment } from './flow/read-model/make-test-environment'

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

export type BDDAggregate = {
  name: string
  projection: AggregateProjection
  commands: Aggregate
  encryption?: AggregateEncryptionFactory
}

export type BDDAggregateAssertion = (
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
  aggregate: BDDAggregate
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

export type BDDReadModel = {
  name: string
  projection: any
  resolvers: any
  encryption?: EventHandlerEncryptionFactory
  adapter: any
}

export type TestQuery = {
  resolver: string
  args?: SerializableMap
}

export type QueryTestResult = Serializable

export type ReadModelContext = {
  readModel: BDDReadModel
} & GivenEventsContext

export type QueryContext = {
  query: TestQuery
  environment: ReadModelTestEnvironment
} & ReadModelContext
