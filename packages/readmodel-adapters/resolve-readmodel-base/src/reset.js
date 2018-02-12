import 'regenerator-runtime/runtime'

const disposeDatabase = async ({ databaseApi, metaApi, storeApi }) => {
  const names = await metaApi.getStorageNames()
  const promises = names.map(async name => {
    await storeApi.dropStorage(name)
  })
  await Promise.all(promises)
  await Promise.all([await metaApi.drop()])
}

const reset = ({ databaseApi, metaApi, storeApi, internalContext }) => {
  if (internalContext.disposePromise) {
    return internalContext.disposePromise
  }

  const disposePromise = internalContext.connectionPromise.then(
    disposeDatabase.bind(null, { databaseApi, metaApi, storeApi })
  )

  Object.keys(internalContext).forEach(key => {
    delete internalContext[key]
  })

  internalContext.disposePromise = disposePromise
  return disposePromise
}

export default reset
