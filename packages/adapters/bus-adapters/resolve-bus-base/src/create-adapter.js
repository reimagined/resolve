const createAdapter = (
  wrapInit,
  wrapMethod,
  subscribe,
  onMessage,
  init,
  publish,
  dispose,
  bus,
  options
) => {
  const config = {
    ...options
  }

  const pool = {
    config,
    handlers: new Map(),
    disposed: false
  }

  wrapInit(pool, init, onMessage.bind(null, pool), bus)

  return Object.freeze({
    publish: wrapMethod(pool, publish),
    subscribe: wrapMethod(pool, subscribe),
    dispose: wrapMethod(pool, dispose)
  })
}

export default createAdapter
