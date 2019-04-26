const makeAutoPromise = worker => {
  let promiseResolve, promiseReject, initResolve
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  const initPromise = new Promise(raise => {
    initResolve = async (continuation, ...args) => {
      raise()
      return await continuation(...args)
    }
  })

  initPromise.then(worker).then(promiseResolve, promiseReject)
  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = initResolve.bind(null, promiseThen)
  promise.catch = initResolve.bind(null, promiseCatch)

  return promise
}

export default makeAutoPromise
