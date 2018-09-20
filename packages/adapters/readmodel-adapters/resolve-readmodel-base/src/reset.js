const reset = ({ metaApi, internalContext }, drop = false) => {
  if (internalContext.disposePromise) {
    return internalContext.disposePromise
  }

  const disposePromise = drop ? metaApi.drop() : Promise.resolve()

  Object.keys(internalContext).forEach(key => {
    delete internalContext[key]
  })

  internalContext.disposePromise = disposePromise
  return disposePromise
}

export default reset
