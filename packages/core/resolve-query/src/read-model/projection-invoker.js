const projectionInvoker = async (repository, event) => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  } else if (repository.hasOwnProperty('lastError')) {
    throw repository.lastError
  }

  try {
    await repository.projection[event.type](event)
  } catch (error) {
    repository.lastError = error
    throw error
  }
}

export default projectionInvoker
