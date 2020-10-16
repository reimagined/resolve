import { symbol, Phases } from './constants'

const properties = (
  {
    promise,
  }: {
    promise: any
  },
  sagaProperties: any
): any => {
  if (promise[symbol].phase !== Phases.SAGA) {
    throw new TypeError()
  }

  promise[symbol].properties = {
    ...promise[symbol].properties,
    ...sagaProperties,
  }

  promise[symbol].phase = Phases.PROPERTIES

  return promise
}

export default properties
