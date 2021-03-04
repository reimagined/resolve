import { GivenEventsContext } from '.'
import { Phases, symbol } from './constants'
import { shouldProduceEvent, shouldThrow } from './aggregate-assertions'
const internalPromise = Symbol()

const getDelayedPromise = (
  continuation: Function
): {
  promiseResolve: Function
  promiseReject: Function
  promise: any
} => {
  const promise: any = {
    [internalPromise]: {
      thenFunctions: [],
      catchFunctions: [],
      state: null,
      result: null,
    },
    then: (nextSuccess: Function, nextFailure?: Function): any => {
      if (promise[internalPromise].state == null) {
        promise[internalPromise].thenFunctions.push(nextSuccess)
      } else if (promise[internalPromise].state === true) {
        nextSuccess(promise[internalPromise].result)
      }
      if (nextFailure != null) {
        if (promise[internalPromise].state == null) {
          promise[internalPromise].catchFunctions.push(nextFailure)
        } else if (promise[internalPromise].state === false) {
          nextFailure(promise[internalPromise].result)
        }
      }
    },
    catch: (nextFailure: Function): any => {
      if (promise[internalPromise].state == null) {
        promise[internalPromise].catchFunctions.push(nextFailure)
      } else if (promise[internalPromise].state === false) {
        nextFailure(promise[internalPromise].result)
      }
    },
  }

  const promiseResolve: any = (result: any): any => {
    if (promise[internalPromise].state == null) {
      promise[internalPromise].state = true
      promise[internalPromise].result = result
      for (const next of promise[internalPromise].thenFunctions) {
        next(result)
      }
      promise[internalPromise].thenFunctions.length = 0
    }
  }

  const promiseReject: any = (result: any): any => {
    if (promise[internalPromise].state == null) {
      promise[internalPromise].state = false
      promise[internalPromise].result = result
      for (const next of promise[internalPromise].catchFunctions) {
        next(result)
      }
      promise[internalPromise].catchFunctions.length = 0
    }
  }

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = continuation.bind(null, promiseThen)
  promise.catch = continuation.bind(null, promiseCatch)

  return {
    promiseResolve,
    promiseReject,
    promise,
  }
}

const getInitPromise = (internalPool: any): Promise<any> =>
  new Promise((resolve: Function) => {
    internalPool.initResolve = (
      continuation: Function,
      ...args: any[]
    ): Promise<any> => {
      resolve()
      return continuation(...args)
    }
  })

const givenEvents = (
  dependencies: any,
  events: Array<any>
): GivenEventsContext => {
  const {
    readModel,
    as,
    execute,
    saga,
    properties,
    setSecretsManager,
    getDefaultSecretsManager,
    aggregate,
    command,
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
  promise[symbol].secretsManager = getDefaultSecretsManager()

  promise[symbol].properties = {
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0,
  }

  promise.readModel = readModel.bind(null, pool)
  promise.as = as.bind(null, pool)
  promise.saga = saga.bind(null, pool)
  promise.properties = properties.bind(null, pool)
  promise.setSecretsManager = setSecretsManager.bind(null, pool)
  promise.aggregate = aggregate.bind(null, promise)
  promise.command = command.bind(null, promise)
  promise.shouldProduceEvent = shouldProduceEvent.bind(null, promise)
  promise.shouldThrow = shouldThrow.bind(null, promise)

  initPromise.then(execute.bind(null, pool))

  return promise
}

export default givenEvents
