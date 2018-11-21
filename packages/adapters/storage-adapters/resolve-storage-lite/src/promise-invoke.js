const promiseInvoke = async (func, ...args) =>
  await new Promise((resolve, reject) =>
    func(...args, (error, result) => (error ? reject(error) : resolve(result)))
  )

export default promiseInvoke
