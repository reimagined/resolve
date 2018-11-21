const getLastError = async repository => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }
  if (repository.hasOwnProperty('lastError')) {
    return repository.lastError
  }

  if (!repository.hasOwnProperty('loadDonePromise')) {
    return null
  }

  try {
    await repository.loadDonePromise
  } catch (error) {
    return error
  }

  return null
}

export default getLastError
