const reset = ({ metaApi, internalContext }, options) => {
  if (internalContext.disposePromise) {
    return internalContext.disposePromise
  }

  const disposePromise = (async () => {
    await metaApi.drop(options)
    await metaApi.disconnect()
  })()

  Object.keys(internalContext).forEach(key => {
    delete internalContext[key]
  })

  internalContext.disposePromise = disposePromise
  return disposePromise
}

export default reset
