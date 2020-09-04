import { Phases, symbol } from './constants'

type BDDAsContext = {
  promise: {
    [symbol]: {
      phase: Phases
      jwt: string
    }
  }
}

const as = ({ promise }: BDDAsContext, jwt: any) => {
  const phase = promise[symbol].phase

  if (![Phases.RESOLVER, Phases.COMMAND].includes(promise[symbol].phase)) {
    throw new TypeError(`invalid phase ${promise[symbol].phase}`)
  }

  promise[symbol].jwt = jwt
  if (phase === Phases.RESOLVER) {
    promise[symbol].phase = Phases.READ_MODEL_AS
  } else {
    promise[symbol].phase = Phases.COMMAND_AS
  }

  return promise
}

export default as
