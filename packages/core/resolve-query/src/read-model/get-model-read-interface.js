const getModelReadInterface = async (repository, skipEventReading = false) => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  try {
    if (!repository.hasOwnProperty('loadDonePromise')) {
      repository.loadDonePromise = repository.init(repository, skipEventReading)
    }

    await repository.loadDonePromise
  } catch (err) {}

  try {
    return await repository.getReadInterface()
  } catch (err) {
    return null
  }
}

export default getModelReadInterface
