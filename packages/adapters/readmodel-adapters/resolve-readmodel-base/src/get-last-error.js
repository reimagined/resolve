const getLastError = async readModel => {
  if (readModel.disposePromise) {
    throw new Error('Read model is disposed')
  }
  if (readModel.hasOwnProperty('lastError')) {
    return readModel.lastError
  }

  if (!readModel.hasOwnProperty('loadEventsPromise')) {
    return null
  }

  try {
    await readModel.loadEventsPromise
  } catch (error) {
    return error
  }

  return null
}

export default getLastError
