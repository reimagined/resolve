import { GivenEventsContext } from '.'
import { Phases, symbol } from './constants'
import { shouldProduceEvent, shouldThrow } from './aggregate-assertions'

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

  let promiseResolve = null
  let promiseReject = null

  const promise: any = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  const pool = { ...dependencies, promise }

  promise[symbol] = internalPool
  promise[symbol].resolve = promiseResolve
  promise[symbol].reject = promiseReject
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

  process.nextTick(execute.bind(null, pool))

  return promise
}

export default givenEvents
