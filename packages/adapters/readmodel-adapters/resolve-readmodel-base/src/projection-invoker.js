const stopProcessingSymbol = Symbol('STOP_PROCESSING')

const projectionInvoker = async (readModel, event, maybeUnordered) => {
  if (readModel.disposePromise) {
    throw new Error('Read model is disposed')
  } else if (readModel.hasOwnProperty('lastError')) {
    throw readModel.lastError
  }

  try {
    if (event == null || event.constructor !== Object) {
      throw new Error('Event malformed')
    }
    if (!(await readModel.metaApi.beginTransaction())) {
      // eslint-disable-next-line no-console
      console.log(
        `Process attempted to write into read-model ${
          readModel.readModelName
        } simultaneously and have been blocked`
      )
      throw stopProcessingSymbol
    }

    const checkResult = await readModel.metaApi.checkAndAcquireSequence(
      event.aggregateId,
      event.aggregateVersion,
      maybeUnordered
    )
    if (checkResult != null) {
      await readModel.metaApi.rollbackTransaction()
      return checkResult
    }

    await readModel.projection[event.type](readModel.writeStoreApi, event)

    if (!maybeUnordered) {
      await readModel.metaApi.setLastTimestamp(event.timestamp)
    }

    await readModel.metaApi.commitTransaction()
  } catch (error) {
    if (error === stopProcessingSymbol) {
      throw error
    }

    await readModel.metaApi.rollbackTransaction()

    readModel.lastError = error
    throw error
  }
}

export default projectionInvoker
