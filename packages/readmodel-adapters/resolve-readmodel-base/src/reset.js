import 'regenerator-runtime/runtime'

const reset = ({ metaApi, internalContext }) => {
  if (internalContext.disposePromise) {
    return internalContext.disposePromise
  }

  const disposePromise = metaApi.drop()

  Object.keys(internalContext).forEach(key => {
    delete internalContext[key]
  })

  internalContext.disposePromise = disposePromise
  return disposePromise
}

export default reset
