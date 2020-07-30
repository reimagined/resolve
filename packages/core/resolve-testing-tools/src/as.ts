import { Phases, symbol } from './constants'

const as = ({ promise }: { promise: any }, jwt: any): any => {
  if (promise[symbol].phase !== Phases.RESOLVER) {
    throw new TypeError()
  }

  promise[symbol].jwtToken = jwt
  promise[symbol].phase = Phases.AS

  return promise
}

export default as
