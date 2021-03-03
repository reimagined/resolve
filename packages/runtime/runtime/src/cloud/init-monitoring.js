import debugLevels from '@resolve-js/debug-levels'

import {
  putCommandMetrics,
  putReadModelProjectionMetrics,
  putReadModelResolverMetrics,
  putViewModelProjectionMetrics,
  putViewModelResolverMetrics,
  putApiHandlerMetrics,
  putSagaMetrics,
} from './metrics'

const getLog = (name) => debugLevels(`resolve:cloud:scheduler:${name}`)

const initMonitoring = (resolve) => {
  const log = getLog('monitoring')

  resolve.monitoring = {
    error: async (error, part, meta) => {
      try {
        log.verbose(`Collect error for '${part}' part`)

        switch (part) {
          case 'command': {
            await putCommandMetrics(
              meta.command.aggregateName,
              meta.command.type,
              meta.command.aggregateId,
              error
            )
            break
          }
          case 'readModelProjection': {
            await putReadModelProjectionMetrics(
              meta.readModelName,
              meta.eventType,
              error
            )
            break
          }
          case 'readModelResolver': {
            await putReadModelResolverMetrics(
              meta.readModelName,
              meta.resolverName,
              error
            )
            break
          }
          case 'viewModelProjection': {
            await putViewModelProjectionMetrics(
              meta.viewModelName,
              meta.eventType,
              error
            )
            break
          }
          case 'viewModelResolver': {
            await putViewModelResolverMetrics(meta.readModelName, error)
            break
          }
          case 'apiHandler': {
            await putApiHandlerMetrics(meta.path, error)
            break
          }
          case 'sagaProjection': {
            await putSagaMetrics(meta.sagaName, meta.eventType, error)
            break
          }
          default: {
            log.verbose(`Unknown error part: ${part}`)
            break
          }
        }
      } catch (error) {
        log.verbose(`Failed to collect error`, error)
      }
    },
  }
}

export default initMonitoring
