import { symbol, Phases } from './constants'

const properties = ({ promise }, sagaProperties) => {
  if (promise[symbol].phase !== Phases.SAGA) {
    throw new TypeError()
  }

  promise[symbol].properties = {
    ...promise[symbol].properties,
    ...sagaProperties
  }

  promise[symbol].phase = Phases.PROPERTIES

  return promise
}

export default properties
