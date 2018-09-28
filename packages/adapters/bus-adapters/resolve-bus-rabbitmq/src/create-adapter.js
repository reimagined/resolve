import defaultOptions from './default-options'


const createAdapter = (
  init,
  publish,
  subscribe,
  dispose,
  wrapMethod,
  onEvent,
  amqp,
  options
) => {
  const config = {
    ...defaultOptions,
    ...options
  }

  let initialPromiseResolve
  const initialPromise = new Promise(
    (resolve) => (initialPromiseResolve = resolve)
  ).then(async () => {
    await init(amqp, options)
  })

  const pool = {
    config,
    disposed: false,
    initialPromise,
    initialPromiseResolve,
    handlers: new Set(),
    onEvent
  }
  
  return Object.freeze({
    publish: wrapMethod(pool, publish),
    subscribe: wrapMethod(pool, subscribe),
    dispose: wrapMethod(pool, dispose)
  })
}

export default createAdapter