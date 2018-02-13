import 'regenerator-runtime/runtime'

const disposeDatabase = async ({ metaApi, storeApi }) => {
  const names = await metaApi.getStorageNames()
  const promises = names.map(async name => {
    await storeApi.dropStorage(name)
  })
  await Promise.all(promises)
  await Promise.all([await metaApi.drop()])
}

const reset = ({ metaApi, storeApi, internalContext }) => {
  if (internalContext.disposePromise) {
    return internalContext.disposePromise
  }

  const disposePromise = disposeDatabase({ metaApi, storeApi })

  Object.keys(internalContext).forEach(key => {
    delete internalContext[key]
  })

  internalContext.disposePromise = disposePromise
  return disposePromise
}

export default reset
