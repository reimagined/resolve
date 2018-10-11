const wrapInit = (pool, init, onMessage, bus) => {
  let initialPromiseResolve
  const initialPromise = new Promise(resolve => {
    initialPromiseResolve = resolve
  }).then(async () => {
    await init(bus, pool, onMessage)
  })

  Object.assign(pool, {
    initialPromise,
    initialPromiseResolve
  })
}

export default wrapInit
