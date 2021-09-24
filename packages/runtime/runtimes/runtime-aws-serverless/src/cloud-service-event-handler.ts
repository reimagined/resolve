import partial from 'lodash.partial'

import { getLog } from '@resolve-js/runtime-base'

import type { Domain, DomainMeta, PerformanceTracer } from '@resolve-js/core'
import type {
  Runtime,
  EventListener,
  EventSubscriber,
} from '@resolve-js/runtime-base'
import { CloudServiceLambdaEvent } from './types'

const log = getLog('cloud-service-event-handler')

// TODO: should not directly access to domain meta!
const getReadModelNames = (domain: DomainMeta) =>
  domain.readModels.map(({ name }) => name)

const getSagaNames = (domain: DomainMeta, domainInterop: Domain) => [
  ...domainInterop.sagaDomain
    .getSagasSchedulersInfo()
    .map((scheduler) => scheduler.name),
  ...domain.sagas.map(({ name }) => name),
]

const handleReadModelEvent = async (
  lambdaEvent: any,
  eventSubscriber: EventSubscriber,
  getListenerIds: () => string[]
) => {
  const { listenerId, key, value } = lambdaEvent
  switch (lambdaEvent.operation) {
    case 'reset': {
      log.debug('operation "reset" started')
      log.debug('resetting event broker')
      await eventSubscriber.reset({ eventSubscriber: listenerId })
      await eventSubscriber.resume({ eventSubscriber: listenerId })
      log.debug('operation "reset" completed')
      return 'ok'
    }
    case 'pause': {
      log.debug('operation "pause" started')
      await eventSubscriber.pause({ eventSubscriber: listenerId })
      log.debug('operation "pause" completed')
      return 'ok'
    }
    case 'resume': {
      log.debug('operation "resume" started')
      await eventSubscriber.resume({ eventSubscriber: listenerId })
      log.debug('operation "resume" completed')
      return 'ok'
    }
    case 'listProperties': {
      log.debug('operation "listProperties" started')
      const result = await eventSubscriber.listProperties({
        eventSubscriber: listenerId,
      })
      log.debug('operation "listProperties" completed')
      log.verbose(JSON.stringify(result, null, 2))
      return result
    }
    case 'getProperty': {
      log.debug('operation "getProperty" started')
      const result = await eventSubscriber.getProperty({
        eventSubscriber: listenerId,
        key,
      })
      log.debug('operation "getProperty" completed')
      log.verbose(JSON.stringify(result, null, 2))
      return result
    }
    case 'setProperty': {
      log.debug('operation "setProperty" started')
      await eventSubscriber.setProperty({
        eventSubscriber: listenerId,
        key,
        value,
      })
      log.debug('operation "setProperty" completed')
      return 'ok'
    }
    case 'deleteProperty': {
      log.debug('operation "deleteProperty" started')
      await eventSubscriber.deleteProperty({
        eventSubscriber: listenerId,
        key,
      })
      log.debug('operation "deleteProperty" completed')
      return 'ok'
    }
    case 'list': {
      const listenerIds = listenerId != null ? [listenerId] : getListenerIds()
      log.verbose(`listenerIds = ${JSON.stringify(listenerIds, null, 2)}`)
      log.debug('operation "list" started')
      const result = await Promise.all(
        listenerIds.map(async (listenerId) => {
          const status = await eventSubscriber.status({
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

type CloudServiceEventContext = {
  upstream: boolean
  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>
  getEventSubscriberDestination: (name: string) => string
  eventListeners: Map<string, EventListener>
  eventSubscriberScope: string
  performanceTracer: PerformanceTracer
  // TODO: bad indirection
  domain: DomainMeta
  domainInterop: Domain
}

export const handleCloudServiceEvent = async (
  lambdaEvent: CloudServiceLambdaEvent,
  runtime: Runtime,
  context: CloudServiceEventContext
) => {
  const { performanceTracer, domain, domainInterop } = context
  const segment = performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('apiEvent')
  subSegment.addAnnotation('operation', lambdaEvent.operation)
  subSegment.addAnnotation('part', lambdaEvent.part)
  subSegment.addAnnotation('origin', 'resolve:apiEvent')

  switch (lambdaEvent.part) {
    case 'bootstrap': {
      try {
        return await runtime.eventListenersManager.bootstrapAll(false)
      } catch (error) {
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    }
    case 'shutdown': {
      try {
        return await runtime.eventListenersManager.shutdownAll(lambdaEvent.soft)
      } catch (error) {
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    }
    case 'readModel': {
      try {
        return await handleReadModelEvent(
          lambdaEvent,
          runtime.eventSubscriber,
          partial(getReadModelNames, domain)
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
        return await handleReadModelEvent(
          lambdaEvent,
          runtime.eventSubscriber,
          partial(getSagaNames, domain, domainInterop)
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
