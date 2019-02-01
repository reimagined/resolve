import { constants } from 'resolve-query'

const handleResolveReadModelEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.operation) {
    case 'reset': {
      const executors = lambdaEvent.name
        ? [resolve.executeQuery.getExecutor(lambdaEvent.name)]
        : resolve.executeQuery.getExecutors(constants.modelTypes.readModel)

      for (const executor of executors) {
        await executor.read({ isBulkRead: true })
        await executor.dispose()
      }

      return 'ok'
    }
    case 'list': {
      return resolve.readModels.map(readModel => readModel.name)
    }
    default: {
      return null
    }
  }
}

const handleResolveEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.part) {
    case 'readModel': {
      return handleResolveReadModelEvent(lambdaEvent, resolve)
    }
    default: {
      return null
    }
  }
}

export default handleResolveEvent
