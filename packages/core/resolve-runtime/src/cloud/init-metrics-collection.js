import {
  putCommandMetrics,
  putReadModelProjectionMetrics,
  putReadModelResolverMetrics,
  putViewModelProjectionMetrics,
  putViewModelResolverMetrics,
  putApiHandlerMetrics,
  putSagaMetrics,
} from './metrics'

const createSafeHandler = (fn) => async (...args) => {
  try {
    await fn(...args)
  } catch (e) {}
}

const initMetricsCollection = (resolve) => {
  resolve.onCommandFailed = createSafeHandler(async (error, command) => {
    await putCommandMetrics(
      command.aggregateName,
      command.type,
      command.aggregateId,
      error
    )
  })

  resolve.onReadModelProjectionError = createSafeHandler(
    async (error, readModelName, eventType) => {
      await putReadModelProjectionMetrics(readModelName, eventType, error)
    }
  )

  resolve.onReadModelResolverError = createSafeHandler(
    async (error, readModelName, resolverName) => {
      await putReadModelResolverMetrics(readModelName, resolverName, error)
    }
  )

  resolve.onViewModelProjectionError = createSafeHandler(
    async (error, viewModelName, eventType) => {
      await putViewModelProjectionMetrics(viewModelName, eventType, error)
    }
  )

  resolve.onViewModelResolverError = createSafeHandler(
    async (error, readModelName) => {
      await putViewModelResolverMetrics(readModelName, error)
    }
  )

  resolve.onApiHandlerError = createSafeHandler(async (error, path) => {
    await putApiHandlerMetrics(path, error)
  })

  resolve.onSagaProjectionError = createSafeHandler(
    async (error, sagaName, eventType) => {
      await putSagaMetrics(sagaName, eventType, error)
    }
  )
}

export default initMetricsCollection
