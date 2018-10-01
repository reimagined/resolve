const wrapInit = (pool, init, onMessage, zmq) => {
  let initialPromiseResolve
  const initialPromise = new Promise(resolve => {
    initialPromiseResolve = resolve
  }).then(async () => {
    await init(zmq, pool, onMessage)
  })

  Object.assign(pool, {
    initialPromise,
    initialPromiseResolve
  })
}

export default wrapInit
