import { Phases, symbol } from './constants'

const as = ({ promise }, jwtToken) => {
  if (promise[symbol].phase !== Phases.RESOLVER) {
    throw new TypeError()
  }

  promise[symbol].jwtToken = jwtToken

  promise[symbol].phase = Phases.AS

  return promise
}

export default as
