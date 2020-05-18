const multiplexAsync = (targetFunction, ...args) => {
  if (typeof targetFunction !== 'function') {
    throw new Error(`Entity ${targetFunction} is not a function`)
  }

  void Promise.resolve()
    .then(targetFunction.bind(null, ...args))
    .catch(error => {
      // eslint-disable-next-line no-console
      console.warn(
        `Async multiplexed function ${targetFunction.name} failed with error: ${error}`
      )
    })

  return Promise.resolve(void null)
}

export default multiplexAsync
