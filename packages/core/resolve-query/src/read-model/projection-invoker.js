const projectionInvoker = async (repository, event, maybeUnordered) => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  } else if (repository.hasOwnProperty('lastError')) {
    throw repository.lastError
  }

  try {
    return await repository.projection[event.type](event, maybeUnordered)
  } catch (error) {
    repository.lastError = error
    throw error
  }
}

export default projectionInvoker
