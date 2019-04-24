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

const reset = async ({ executeQuery }, listenerId) => {
  await executeQuery.drop(listenerId)
}

const invokeMetaLock = async (resolve, listenerId, operation) => {
  const result = await resolve.lambda
    .invoke({
      FunctionName: process.env.RESOLVE_META_LOCK_LAMBDA_ARN,
      Payload: JSON.stringify({
        listenerId,
        operation
      })
    })
    .promise()

  if (operation === 'reset') {
    await reset(resolve, listenerId)
  }

  return result
}

const handleResolveReadModelEvent = async (
  lambdaEvent,
  resolve,
  getListenerIds
) => {
  switch (lambdaEvent.operation) {
    case 'reset':
    case 'pause':
    case 'resume': {
      if (lambdaEvent.name) {
        await invokeMetaLock(resolve, lambdaEvent.name, lambdaEvent.operation)
      } else {
        for (const listenerId of getListenerIds(resolve)) {
          await invokeMetaLock(resolve, listenerId, lambdaEvent.operation)
        }
      }
      return 'ok'
    }
    case 'list': {
      return Promise.all(
        getListenerIds(resolve).map(async listenerId => {
          const state = await invokeMetaLock(resolve, listenerId, 'status')
          return {
            ...state,
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
