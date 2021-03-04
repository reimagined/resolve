const multiplexAsync = (targetFunction, ...args) => {
  if (typeof targetFunction !== 'function') {
    throw new Error(`Entity ${targetFunction} is not a function`)
  }

  ;(async () => {
    try {
      await Promise.resolve()
      await targetFunction(...args)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `Async multiplexed function ${targetFunction.name} failed with error: ${error.message}\n${error.stack}`
      )
    }
  })()

  return Promise.resolve()
}

export default multiplexAsync
