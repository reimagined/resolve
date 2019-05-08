import debugLevels from 'debug-levels'

import bootstrap from '../bootstrap'
import isSagaName from '../utils/is-saga-name'

const log = debugLevels('resolve:resolve-runtime:deploy-service-event-handler')

const isReadModelName = (resolve, name) => !isSagaName(resolve, name)

const getReadModelNames = resolve => {
  return resolve.readModels
    .map(({ name }) => name)
    .filter(isReadModelName.bind(null, resolve))
}

const getSagaNames = resolve => {
  return resolve.readModels
    .map(({ name }) => name)
    .filter(isSagaName.bind(null, resolve))
}

const handleResolveReadModelEvent = async (
  lambdaEvent,
  resolve,
  getListenerIds
) => {
  const { key, value } = lambdaEvent
  // TODO use lambdaEvent.listenerId
  const listenerId = lambdaEvent.listenerId || lambdaEvent.name
  switch (lambdaEvent.operation) {
    case 'reset': {
      log.debug('operation "reset" started')
      await Promise.all([
        resolve.eventBroker.reset(listenerId),
        resolve.executeQuery.drop(listenerId)
      ])
      log.debug('operation "reset" completed')
      return 'ok'
    }
    case 'pause': {
      log.debug('operation "pause" started')
      await resolve.eventBroker.pause(listenerId)
      log.debug('operation "pause" completed')
      return 'ok'
    }
    case 'resume': {
      log.debug('operation "resume" started')
      await resolve.eventBroker.resume(listenerId)
      log.debug('operation "resume" completed')
      return 'ok'
    }
    case 'listProperties': {
      log.debug('operation "listProperties" started')
      const result = await await resolve.eventBroker.listProperties(listenerId)
      log.debug('operation "listProperties" completed')
      return result
    }
    case 'getProperty': {
      log.debug('operation "getProperty" started')
      const result = await resolve.eventBroker.getProperty(listenerId, key)
      log.debug('operation "getProperty" completed')
      return result
    }
    case 'setProperty': {
      log.debug('operation "setProperty" started')
      await resolve.eventBroker.setProperty(listenerId, key, value)
      log.debug('operation "setProperty" completed')
      return 'ok'
    }
    case 'deleteProperty': {
      log.debug('operation "deleteProperty" started')
      await resolve.eventBroker.deleteProperty(listenerId, key)
      log.debug('operation "deleteProperty" completed')
      return 'ok'
    }
    case 'list': {
      const listenerIds =
        listenerId != null ? [listenerId] : getListenerIds(resolve)
      log.verbose(`listenerIds = ${JSON.stringify(listenerIds, null, 2)}`)
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
