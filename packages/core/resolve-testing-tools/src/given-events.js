import { Phases, symbol } from './constants'

const getDelayedPromise = continuation => {
  let fastEventLoop = false
  try {
    fastEventLoop = +process.version.substring(1).split('.')[0] >= 12
  } catch (e) {}

  let [promiseResolve, promiseReject, promise] = [null, null, null]

  if (!fastEventLoop) {
    promise = new Promise((resolve, reject) => {
      promiseResolve = resolve
      promiseReject = reject
    })
  } else {
    const internalPromise = Symbol()
    promise = {
      [internalPromise]: {
        thenFunctions: [],
        catchFunctions: [],
        state: null,
        result: null
      },
      then: next => {
        if (promise[internalPromise].state == null) {
          promise[internalPromise].thenFunctions.push(next)
        } else if (promise[internalPromise].state === true) {
          next(promise[internalPromise].result)
        }
      },
      catch: next => {
        if (promise[internalPromise].state == null) {
          promise[internalPromise].catchFunctions.push(next)
        } else if (promise[internalPromise].state === false) {
          next(promise[internalPromise].result)
        }
      }
    }
    promiseResolve = result => {
      if (promise[internalPromise].state == null) {
        promise[internalPromise].state = true
        promise[internalPromise].result = result
        for (const next of promise[internalPromise].thenFunctions) {
          next(result)
        }
        promise[internalPromise].thenFunctions.length = 0
      }
    }
    promiseReject = result => {
      if (promise[internalPromise].state == null) {
        promise[internalPromise].state = false
        promise[internalPromise].result = result
        for (const next of promise[internalPromise].catchFunctions) {
          next(result)
        }
        promise[internalPromise].catchFunctions.length = 0
      }
    }
  }

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = continuation.bind(null, promiseThen)
  promise.catch = continuation.bind(null, promiseCatch)

  return { promiseResolve, promiseReject, promise }
}

const getInitPromise = internalPool =>
  new Promise(initResolve => {
    internalPool.initResolve = async (continuation, ...args) => {
      initResolve()
      return await continuation(...args)
    }
  })

const givenEvents = (dependencies, events) => {
  const {
    readModel,
    as,
    init,
    saga,
    properties,
    setSecretsManager,
    defaultSecretsManager
  } = dependencies

  const internalPool = Object.create(null)
  const initPromise = getInitPromise(internalPool)
  const { promiseResolve, promiseReject, promise } = getDelayedPromise(
    internalPool.initResolve
  )
  const pool = { ...dependencies, promise }

  promise[symbol] = internalPool
  promise[symbol].resolve = promiseResolve
  promise[symbol].reject = promiseReject
  promise[symbol].initPromise = initPromise
  promise[symbol].events = events
  promise[symbol].phase = Phases.GIVEN_EVENTS

  promise[symbol].properties = {
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0
  }

  promise.readModel = readModel.bind(null, pool)
  promise.as = as.bind(null, pool)
  promise.saga = saga.bind(null, pool)
  promise.properties = properties.bind(null, pool)
  promise.secretsManager = defaultSecretsManager
  promise.setSecretsManager = setSecretsManager.bind(null, pool)

  initPromise.then(init.bind(null, pool))

  return promise
}

export default givenEvents
