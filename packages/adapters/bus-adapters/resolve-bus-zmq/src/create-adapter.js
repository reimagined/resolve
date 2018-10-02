import defaultOptions from './default-options'

const createAdapter = (
  wrapInit,
  wrapMethod,
  onMessage,
  init,
  publish,
  subscribe,
  dispose,
  zmq,
  options
) => {
  const config = {
    ...defaultOptions,
    ...options
  }

  const pool = {
    config,
    disposed: false,
    handlers: new Set()
  }

  wrapInit(pool, init, onMessage.bind(null, pool), zmq)

  return Object.freeze({
    publish: wrapMethod(pool, publish),
    subscribe: wrapMethod(pool, subscribe),
    dispose: wrapMethod(pool, dispose)
  })
}

export default createAdapter
