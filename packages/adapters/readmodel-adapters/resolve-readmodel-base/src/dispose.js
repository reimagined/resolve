const dispose = ({ disconnect, drop, internalContext }, options = {}) => {
  if (options != null && options.constructor !== Object) {
    throw new Error('Dispose options should be plain object if provided')
  }

  if (internalContext.disposePromise) {
    return internalContext.disposePromise
  }

  const disposePromise = (async () => {
    if (Object.keys(options).length > 0) {
      await drop(options)
    }
    await disconnect()
  })()

  Object.keys(internalContext).forEach(key => {
    delete internalContext[key]
  })

  internalContext.disposePromise = disposePromise
  return disposePromise
}

export default dispose
