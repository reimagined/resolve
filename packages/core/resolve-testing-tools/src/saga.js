import { symbol, Phases } from './constants'

const saga = (
  { promise },
  { handlers, sideEffects, adapter, name = 'TEST-SAGA-READ-MODEL' }
) => {
  if (promise[symbol].phase !== Phases.GIVEN_EVENTS) {
    throw new TypeError()
  }

  promise[symbol].handlers = handlers != null ? handlers : {}
  promise[symbol].sideEffects = sideEffects != null ? sideEffects : {}
  promise[symbol].adapter = adapter
  promise[symbol].name = name

  promise[symbol].phase = Phases.SAGA

  return promise
}

export default saga
