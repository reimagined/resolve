import { GivenEventsContext } from '.'
import { SagaParams } from './saga'
import { Phases, symbol } from './constants'
import { shouldProduceEvent, shouldThrow } from './aggregate-assertions'

const internalPromise = Symbol()

type ComplexPromise = {
  then: Function
  catch: Function
  [internalPromise]: {
    thenFunctions: Array<Function>
    catchFunctions: Array<Function>
    state: any
    result: any
  }
}

const getDelayedPromise = (continuation: Function): any => {
  let fastEventLoop = false
  try {
    fastEventLoop = +process.version.substring(1).split('.')[0] >= 12
  } catch (e) {}

  let promise: Promise<any> | ComplexPromise
  let promiseResolve: Function | null = null
  let promiseReject: Function | null = null

  if (!fastEventLoop) {
    promise = new Promise((resolve, reject) => {
      promiseResolve = resolve
      promiseReject = reject
    })
  } else {
    const complexPromise: ComplexPromise = {
      [internalPromise]: {
        thenFunctions: [],
        catchFunctions: [],
        state: null,
        result: null
      },
      then: (next: Function): any => {
        if (complexPromise[internalPromise].state == null) {
          complexPromise[internalPromise].thenFunctions.push(next)
        } else if (complexPromise[internalPromise].state === true) {
          next(complexPromise[internalPromise].result)
        }
      },
      catch: (next: Function): any => {
        if (complexPromise[internalPromise].state == null) {
          complexPromise[internalPromise].catchFunctions.push(next)
        } else if (complexPromise[internalPromise].state === false) {
          next(complexPromise[internalPromise].result)
        }
      }
    }
    promiseResolve = (result: any): any => {
      if (complexPromise[internalPromise].state == null) {
        complexPromise[internalPromise].state = true
        complexPromise[internalPromise].result = result
        for (const next of complexPromise[internalPromise].thenFunctions) {
          next(result)
        }
        complexPromise[internalPromise].thenFunctions.length = 0
      }
    }
    promiseReject = (result: any): any => {
      if (complexPromise[internalPromise].state == null) {
        complexPromise[internalPromise].state = false
        complexPromise[internalPromise].result = result
        for (const next of complexPromise[internalPromise].catchFunctions) {
          next(result)
        }
        complexPromise[internalPromise].catchFunctions.length = 0
      }
    }
    promise = complexPromise
  }

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = continuation.bind(null, promiseThen)
  promise.catch = continuation.bind(null, promiseCatch)

  return { promiseResolve, promiseReject, promise }
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
    command
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
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0
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
