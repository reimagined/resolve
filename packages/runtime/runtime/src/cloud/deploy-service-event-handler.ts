import debugLevels from '@resolve-js/debug-levels'

import bootstrap from '../common/bootstrap'
import shutdown from '../common/shutdown'

import type { Resolve } from '../common/types'

const log = debugLevels('resolve:runtime:deploy-service-event-handler')

const getReadModelNames = (resolve: Resolve) =>
  resolve.domain.readModels.map(({ name }) => name)

const getSagaNames = (resolve: Resolve) => [
  ...resolve.domainInterop.sagaDomain
    .getSagasSchedulersInfo()
    .map((scheduler) => scheduler.name),
  ...resolve.domain.sagas.map(({ name }) => name),
]

const handleResolveReadModelEvent = async (
  lambdaEvent: any,
  resolve: Resolve,
  getListenerIds: (resolve: Resolve) => string[]
) => {
  const { listenerId, key, value } = lambdaEvent
  switch (lambdaEvent.operation) {
    case 'reset': {
      log.debug('operation "reset" started')
      log.debug('resetting event broker')
      await resolve.eventSubscriber.reset({ eventSubscriber: listenerId })
      await resolve.eventSubscriber.resume({ eventSubscriber: listenerId })
      log.debug('operation "reset" completed')
      return 'ok'
    }
    case 'pause': {
      log.debug('operation "pause" started')
      await resolve.eventSubscriber.pause({ eventSubscriber: listenerId })
      log.debug('operation "pause" completed')
      return 'ok'
    }
    case 'resume': {
      log.debug('operation "resume" started')
      await resolve.eventSubscriber.resume({ eventSubscriber: listenerId })
      log.debug('operation "resume" completed')
      return 'ok'
    }
    case 'listProperties': {
      log.debug('operation "listProperties" started')
      const result = await resolve.eventSubscriber.listProperties({
        eventSubscriber: listenerId,
      })
      log.debug('operation "listProperties" completed')
      log.verbose(JSON.stringify(result, null, 2))
      return result
    }
    case 'getProperty': {
      log.debug('operation "getProperty" started')
      const result = await resolve.eventSubscriber.getProperty({
        eventSubscriber: listenerId,
        key,
      })
      log.debug('operation "getProperty" completed')
      log.verbose(JSON.stringify(result, null, 2))
      return result
    }
    case 'setProperty': {
      log.debug('operation "setProperty" started')
      await resolve.eventSubscriber.setProperty({
        eventSubscriber: listenerId,
        key,
        value,
      })
      log.debug('operation "setProperty" completed')
      return 'ok'
    }
    case 'deleteProperty': {
      log.debug('operation "deleteProperty" started')
      await resolve.eventSubscriber.deleteProperty({
        eventSubscriber: listenerId,
        key,
      })
      log.debug('operation "deleteProperty" completed')
      return 'ok'
    }
    case 'list': {
      const listenerIds =
        listenerId != null ? [listenerId] : getListenerIds(resolve)
      log.verbose(`listenerIds = ${JSON.stringify(listenerIds, null, 2)}`)
      log.debug('operation "list" started')
      const result = await Promise.all(
        listenerIds.map(async (listenerId) => {
          const status = await resolve.eventSubscriber.status({
            eventSubscriber: listenerId,
          })
          return {
            ...status,
            name: listenerId,
          }
        })
      )
      log.debug('operation "list" completed')
      log.verbose(JSON.stringify(result, null, 2))
      return result
    }
    default: {
      throw new Error(
        `Unknown operation from the deploy service { "operation": ${JSON.stringify(
          lambdaEvent.operation
        )} }`
      )
    }
  }
}

const handleDeployServiceEvent = async (
  lambdaEvent: any,
  resolve: Resolve,
  lambdaContext: any
) => {
  const segment = resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('apiEvent')
  subSegment.addAnnotation('operation', lambdaEvent.operation)
  subSegment.addAnnotation('part', lambdaEvent.part)
  subSegment.addAnnotation('origin', 'resolve:apiEvent')

  switch (lambdaEvent.part) {
    case 'bootstrap': {
      try {
        //TODO: it used to pass lambdaContext as the second arg, but bootstrap expects only one
        return await bootstrap(resolve)
      } catch (error) {
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    }
    case 'shutdown': {
      try {
        return await shutdown(resolve, lambdaContext, lambdaEvent)
      } catch (error) {
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    }
    case 'readModel': {
      try {
        return await handleResolveReadModelEvent(
          lambdaEvent,
          resolve,
          getReadModelNames
        )
      } catch (error) {
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    }
    case 'saga': {
      try {
        return await handleResolveReadModelEvent(
          lambdaEvent,
          resolve,
          getSagaNames
        )
      } catch (error) {
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    }
    default: {
      subSegment.close()
      throw new Error(
        `Unknown part from the deploy service { "part": ${JSON.stringify(
          lambdaEvent.part
        )} }`
      )
    }
  }
}

export default handleDeployServiceEvent
