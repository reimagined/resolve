import { symbol, Phases } from './constants'
import { SerializableMap } from 'resolve-core'

type BDDCommandContext = {
  [symbol]: {
    phase: Phases
    command: {
      name: string
      payload: SerializableMap
      aggregateId: string
    }
  }
}

export const command = (
  context: BDDCommandContext,
  name: string,
  aggregateId?: string | SerializableMap,
  payload?: SerializableMap
): any => {
  if (context[symbol].phase !== Phases.AGGREGATE) {
    throw new TypeError()
  }

  const actualAggregateId =
    typeof aggregateId === 'string' && aggregateId
      ? aggregateId
      : 'test-aggregate-id'
  const actualPayload = typeof aggregateId === 'string' ? payload : aggregateId

  context[symbol].phase = Phases.COMMAND
  context[symbol].command = {
    name,
    payload: actualPayload || {},
    aggregateId: actualAggregateId
  }

  return context
}
