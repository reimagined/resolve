const stopProcessingSymbol = Symbol('STOP_PROCESSING')

const projectionInvoker = async (repository, event, maybeUnordered) => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  } else if (repository.hasOwnProperty('lastError')) {
    throw repository.lastError
  }

  try {
    if (event == null || event.constructor !== Object) {
      throw new Error('Event malformed')
    }
    if (!(await repository.metaApi.beginTransaction())) {
      // eslint-disable-next-line no-console
      console.log(
        `Process attempted to write into read-model ${
          repository.readModelName
        } simultaneously and have been blocked`
      )
      throw stopProcessingSymbol
    }

    const checkResult = await repository.metaApi.checkAndAcquireSequence(
      event.aggregateId,
      event.aggregateVersion,
      maybeUnordered
    )
    if (checkResult != null) {
      await repository.metaApi.rollbackTransaction()
      return checkResult
    }

    await repository.projection[event.type](repository.writeStoreApi, event)

    if (!maybeUnordered) {
      await repository.metaApi.setLastTimestamp(event.timestamp)
    }

    await repository.metaApi.commitTransaction()
  } catch (error) {
    if (error === stopProcessingSymbol) {
      throw error
    }

    await repository.metaApi.rollbackTransaction()

    repository.lastError = error
    throw error
  }
}

export default projectionInvoker
