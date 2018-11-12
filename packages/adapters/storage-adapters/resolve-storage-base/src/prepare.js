const prepare = (pool, connect, init, adapterSpecificArguments) => {
  let connectPromiseResolve
  const connectPromise = new Promise(resolve => {
    connectPromiseResolve = resolve
  }).then(async () => {
    await connect(
      pool,
      adapterSpecificArguments
    )
  })

  let initialPromiseResolve
  const initialPromise = new Promise(resolve => {
    initialPromiseResolve = resolve
  }).then(async () => {
    await init(pool)
  })

  Object.assign(pool, {
    initialPromise,
    initialPromiseResolve,
    connectPromise,
    connectPromiseResolve
  })
}

export default prepare
