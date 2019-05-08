import bootstrap from '../bootstrap'
import {
  RESOLVE_SAGA_PREFIX,
  RESOLVE_SCHEDULER_SAGA_PREFIX
} from '../sagas/constants'
import debugLevels from 'debug-levels'

const log = debugLevels('resolve:resolve-runtime:deploy-service-event-handler')

const isSagaName = name =>
  name.indexOf(RESOLVE_SAGA_PREFIX) === 0 ||
  name.indexOf(RESOLVE_SCHEDULER_SAGA_PREFIX) === 0

const isReadModelName = name => !isSagaName(name)

const getReadModelNames = resolve => {
  return resolve.readModels.map(({ name }) => name).filter(isReadModelName)
}

const getSagaNames = resolve => {
  return resolve.readModels.map(({ name }) => name).filter(isSagaName)
}

const handleResolveReadModelEvent = async (
  lambdaEvent,
  resolve,
  getListenerIds
) => {
  const listenerIds = lambdaEvent.hasOwnProperty('name')
    ? [lambdaEvent.name]
    : getListenerIds(resolve)
  log.verbose(`listenerIds = ${JSON.stringify(listenerIds, null, 2)}`)

  switch (lambdaEvent.operation) {
    case 'reset': {
      log.debug('operation "reset" started')
      await Promise.all(
        listenerIds.map(
          async listenerId =>
            await Promise.all([
              resolve.eventBroker.reset(listenerId),
              resolve.executeQuery.drop(listenerId)
            ])
        )
      )
      log.debug('operation "reset" successfully')
      return 'ok'
    }
    case 'pause': {
      log.debug('operation "pause" started')
      await Promise.all(listenerIds.map(resolve.eventBroker.pause))
      log.debug('operation "pause" successfully')
      return 'ok'
    }
    case 'resume': {
      log.debug('operation "resume" started')
      await Promise.all(listenerIds.map(resolve.eventBroker.resume))
      log.debug('operation "resume" successfully')
      return 'ok'
    }
    case 'list': {
      log.debug('operation "list" started')
      const result = await Promise.all(
        listenerIds.map(async listenerId => {
          const status = await resolve.eventBroker.status(listenerId)
          return {
            ...status,
            name: listenerId
          }
        })
      )
      log.debug('operation "list" successfully')
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

const handleDeployServiceEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.part) {
    case 'bootstrap': {
      return await bootstrap(resolve)
    }
    case 'readModel': {
      return await handleResolveReadModelEvent(
        lambdaEvent,
        resolve,
        getReadModelNames
      )
    }
    case 'saga': {
      return await handleResolveReadModelEvent(
        lambdaEvent,
        resolve,
        getSagaNames
      )
    }
    default: {
      throw new Error(
        `Unknown part from the deploy service { "part": ${JSON.stringify(
          lambdaEvent.part
        )} }`
      )
    }
  }
}

export default handleDeployServiceEvent
