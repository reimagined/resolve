const prepare = (pool, connect, init, adapterSpecificArguments) => {
  let initResultPromiseResolve
  let initResultPromiseReject
  pool.initialPromiseResult = new Promise((resolve, reject) => {
    initResultPromiseResolve = resolve
    initResultPromiseReject = reject
  })
  pool.initialPromiseResult.catch(() => {})

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
    try {
      initResultPromiseResolve(await init(pool))
    } catch (error) {
      initResultPromiseReject(error)
      throw error
    }
  })

  Object.assign(pool, {
    initialPromise,
    initialPromiseResolve,
    connectPromise,
    connectPromiseResolve
  })
}

export default prepare
