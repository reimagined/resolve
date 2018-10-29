const wrapInit = (pool, init, db) => {
  let initialPromiseResolve
  const initialPromise = new Promise(resolve => {
    initialPromiseResolve = resolve
  }).then(async () => {
    await init(db, pool)
  })

  Object.assign(pool, {
    initialPromise,
    initialPromiseResolve
  })
}

export default wrapInit
