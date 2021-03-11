import {
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
} from '@resolve-js/core'
import { symbol, Phases } from './constants'
import { BDDAggregateAssertion } from './aggregate-assertions'

export type BDDAggregate = {
  name: string
  projection: AggregateProjection
  commands: Aggregate
  encryption?: AggregateEncryptionFactory
}

type BDDAggregateContext = {
  [symbol]: {
    phase: Phases
    aggregate: BDDAggregate
    aggregateId: string
    assertion: BDDAggregateAssertion
    isDefaultAssertion: boolean
  }
}

export const aggregate = (
  context: BDDAggregateContext,
  aggregate: BDDAggregate,
  aggregateId?: string
): any => {
  if (context[symbol].phase !== Phases.GIVEN_EVENTS) {
    throw new TypeError()
  }

  context[symbol].phase = Phases.AGGREGATE
  context[symbol].aggregate = {
    name: aggregate.name,
    commands: aggregate.commands || {},
    projection: aggregate.projection || {},
    encryption: aggregate.encryption,
  }
  context[symbol].aggregateId = aggregateId || 'test-aggregate-id'
  context[symbol].assertion = (resolve, reject, result, error) => {
    if (error != null) {
      reject(error)
    } else {
      resolve(result)
    }
  }
  context[symbol].isDefaultAssertion = true

  return context
}
