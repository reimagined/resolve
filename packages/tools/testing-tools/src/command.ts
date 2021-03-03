import { symbol, Phases } from './constants'
import { SerializableMap } from '@resolve-js/core'

type BDDCommandContext = {
  [symbol]: {
    phase: Phases
    command: {
      name: string
      payload?: SerializableMap
    }
  }
}

export const command = (
  context: BDDCommandContext,
  name: string,
  payload?: SerializableMap
) => {
  if (context[symbol].phase !== Phases.AGGREGATE) {
    throw new TypeError()
  }

  context[symbol].phase = Phases.COMMAND
  context[symbol].command = {
    name,
    payload,
  }

  return context
}
