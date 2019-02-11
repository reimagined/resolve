const disposeReadModel = async (readModel, options = {}) => {
  if (options == null || options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  if (readModel.disposePromise) {
    return await readModel.disposePromise
  }

  const disposePromise = readModel.metaApi.dropReadModel()

  for (const key of Object.keys(readModel)) {
    delete readModel[key]
  }

  readModel.disposePromise = disposePromise
  return await readModel.disposePromise
}

export default disposeReadModel
