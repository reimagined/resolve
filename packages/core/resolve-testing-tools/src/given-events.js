import { Phases, symbol } from './constants'

const givenEvents = (dependencies, events) => {
  const { readModel, as, init, saga, getInitPromise, properties } = dependencies

  let promiseResolve = null,
    promiseReject = null
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })
  const pool = { ...dependencies, promise }

  promise[symbol] = Object.create(null)
  promise[symbol].resolve = promiseResolve
  promise[symbol].reject = promiseReject
  promise[symbol].initPromise = getInitPromise(pool)
  promise[symbol].events = events
  promise[symbol].phase = Phases.GIVEN_EVENTS

  promise[symbol].properties = {
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0
  }

  promise.readModel = readModel.bind(null, pool)
  promise.as = as.bind(null, pool)
  promise.saga = saga.bind(null, pool)
  promise.properties = properties.bind(null, pool)

  promise[symbol].initPromise.then(init.bind(null, pool))

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = promise[symbol].initResolve.bind(null, promiseThen)
  promise.catch = promise[symbol].initResolve.bind(null, promiseCatch)

  return promise
}

export default givenEvents
