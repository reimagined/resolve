const wrapInit = (pool, init, onMessage, amqp) => {
  let initialPromiseResolve
  const initialPromise = new Promise(resolve => {
    initialPromiseResolve = resolve
  }).then(async () => {
    await init(amqp, pool, onMessage)
  })

  Object.assign(pool, {
    initialPromise,
    initialPromiseResolve
  })
}

export default wrapInit
