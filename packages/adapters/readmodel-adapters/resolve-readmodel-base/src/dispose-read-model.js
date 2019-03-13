const disposeReadModel = async readModel => {
  if (readModel.disposePromise) {
    return await readModel.disposePromise
  }

  const disposePromise = readModel.dropReadModel()

  for (const key of Object.keys(readModel)) {
    delete readModel[key]
  }

  readModel.disposePromise = disposePromise
  return await readModel.disposePromise
}

export default disposeReadModel
