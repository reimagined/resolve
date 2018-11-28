import authenticateWrapper from './authenticate_wrapper'
import createResponse from './create_response'

const authStrategies = new Map()

const callbackInvoker = async function(...args) {
  const strategyArgs = args.slice(0, args.length - 1)
  const done = args[args.length - 1]

  try {
    done(null, await this.apiCallback(this.currentReq, ...strategyArgs))
  } catch (error) {
    done(error)
  }
}

const getBaseStrategyAndOptions = (strategyHash, createStrategy, options) => {
  if (!authStrategies.has(strategyHash)) {
    const strategyDescriptor = createStrategy(options)
    const originalOptions = strategyDescriptor.options
    const StrategyFactory = strategyDescriptor.factory
    const strategyBase = new StrategyFactory(originalOptions, callbackInvoker)
    authStrategies.set(strategyHash, { strategyBase, originalOptions })
  }

  return authStrategies.get(strategyHash)
}

const TIMEOUT = 30000

const executeStrategy = async (
  authRequest,
  createStrategy,
  options,
  strategyHash,
  callback
) => {
  const { jwtCookie, rootPath } = authRequest.resolve

  const { strategyBase, originalOptions } = getBaseStrategyAndOptions(
    strategyHash,
    createStrategy,
    options
  )
  const internalRes = createResponse()

  const strategy = Object.create(strategyBase)
  Object.assign(strategy, {
    ...authenticateWrapper,
    _verify: callbackInvoker,
    apiCallback: callback,
    currentReq: authRequest,
    originalOptions,
    internalRes,
    jwtCookie,
    rootPath
  })

  strategy.authDonePromise = new Promise((resolve, reject) => {
    strategy.resolveAuth = resolve
    strategy.rejectAuth = reject
  })

  strategy.authenticate(authRequest, { response: internalRes })

  setTimeout(strategy.rejectAuth, TIMEOUT)

  await strategy.authDonePromise

  return internalRes
}

export default executeStrategy
