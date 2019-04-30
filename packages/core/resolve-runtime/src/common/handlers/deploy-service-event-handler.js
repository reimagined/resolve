import bootstrap from '../bootstrap'
import {
  RESOLVE_SAGA_PREFIX,
  RESOLVE_SCHEDULER_SAGA_PREFIX
} from '../sagas/constants'

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

  switch (lambdaEvent.operation) {
    case 'reset': {
      await Promise.all(
        listenerIds.map(
          async listenerId =>
            await Promise.all([
              resolve.eventBroker.reset(listenerId),
              resolve.executeQuery.drop(listenerId)
            ])
        )
      )
      return 'ok'
    }
    case 'pause': {
      await Promise.all(listenerIds.map(resolve.eventBroker.pause))
      return 'ok'
    }
    case 'resume': {
      await Promise.all(listenerIds.map(resolve.eventBroker.resume))
      return 'ok'
    }
    case 'list': {
      return await Promise.all(
        listenerIds.map(async listenerId => {
          const status = await resolve.eventBroker.status(listenerId)
          return {
            ...status,
            name: listenerId
          }
        })
      )
    }
    default: {
      return null
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
      return null
    }
  }
}

export default handleDeployServiceEvent
