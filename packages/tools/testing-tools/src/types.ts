import {
  Event,
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  CommandResult,
  SerializableMap,
} from '@resolve-js/core'
import { AggregateTestEnvironment } from './flow/aggregate/make-test-environment'

export type OmitFirstArgument<F> = F extends (
  first: any,
  ...args: infer Params
) => infer Result
  ? (...args: Params) => Result
  : never

export type TestEvent = Omit<Omit<Event, 'timestamp'>, 'aggregateVersion'> & {
  timestamp?: number
}

export type TestContext = {
  events: TestEvent[]
}

export type GivenEventsContext = {
  events: TestEvent[]
}

export type AggregateContext = {
  aggregate: BDDAggregate
} & GivenEventsContext

export type AggregateTestPromise = Promise<AggregateTestResult> & {
  setAuthToken: (token: string) => void
  isCompleted: () => boolean
}

export type CommandContext = {
  command: {
    name: string
    payload?: SerializableMap
  }
  environment: AggregateTestEnvironment
} & AggregateContext

export type AggregateTestResult = CommandResult

export type BDDAggregate = {
  name: string
  projection: AggregateProjection
  commands: Aggregate
  encryption?: AggregateEncryptionFactory
}
