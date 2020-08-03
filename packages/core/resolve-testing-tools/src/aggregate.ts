import { Aggregate, AggregateProjection } from 'resolve-core'
import { symbol, Phases } from './constants'

type BDDAggregate = {
  name: string
  projection: AggregateProjection
  commands: Aggregate
}

type BDDAggregateContext = {
  [symbol]: {
    phase: Phases
    aggregate: BDDAggregate
  }
}

export const aggregate = (
  context: BDDAggregateContext,
  aggregate: BDDAggregate
): any => {
  if (context[symbol].phase !== Phases.GIVEN_EVENTS) {
    throw new TypeError()
  }

  context[symbol].phase = Phases.AGGREGATE
  context[symbol].aggregate = {
    name: aggregate.name,
    commands: aggregate.commands || {},
    projection: aggregate.projection || {}
  }

  return context
}
