import type { ExternalMethods, ReadModelCursor } from './types'

async function sleep(delay: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

const build: ExternalMethods['build'] = async (
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis
) => {
  console.log('Start build')

  const state = await basePool.getReplicationState(basePool)
  if (state.status === 'error') {
    console.error('Refuse to start or continue replication with error state')
    return
  }
  if (state.paused) {
    console.log('Refuse to start or continue replication because it is paused')
    return
  }

  let iterator = state.iterator
  let localContinue = true
  let lastError: Error | null = null

  while (true) {
    const cursor =
      iterator == null ? null : (iterator.cursor as ReadModelCursor)
    const { cursor: nextCursor, events } = await eventstoreAdapter.loadEvents({
      cursor,
      limit: 100,
    })
    const {
      existingSecrets,
      deletedSecrets,
    } = await eventstoreAdapter.gatherSecretsFromEvents(events)
    const result = await basePool.callReplicate(
      basePool,
      events,
      existingSecrets,
      deletedSecrets,
      { cursor }
    )

    let appliedEventsCount = 0

    if (result.type === 'alreadyInProgress') {
      const errorMessage =
        "Refuse to start or continue replication since it's already in progress"
      lastError = { name: 'Error', message: errorMessage }
      console.log(errorMessage)
    } else if (result.type === 'launched') {
      await sleep(100)
      while (true) {
        const state = await basePool.getReplicationState(basePool)
        if (state.status === 'batchInProgress') {
          await sleep(100)
        } else if (state.status === 'batchDone') {
          iterator = { cursor: nextCursor }
          appliedEventsCount =
            state.statusData != null
              ? (state.statusData.appliedEventsCount as number)
              : 0
          break
        } else if (state.status === 'serviceError') {
          lastError = {
            name: 'Error',
            message: 'Service error',
          }
          break
        } else if (state.status === 'error') {
          lastError = {
            name:
              state.statusData != null
                ? (state.statusData.name as string)
                : 'Error',
            message:
              state.statusData != null
                ? (state.statusData.message as string)
                : 'Unknown error',
          }

          console.error(state.statusData)
          break
        }
      }
    } else {
      const errorMessage = `Unhandled replicate result. HTTP status code: ${result.httpStatus}`
      lastError = { name: 'Error', message: errorMessage }

      console.error(errorMessage)
    }

    const isBuildSuccess = lastError == null && appliedEventsCount > 0

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
      console.log('Continuing in the same loop')
    } else {
      if (isBuildSuccess) {
        console.log('Calling next')
        await next()
      }
      console.log('Exiting loop')
      break
    }
  }
}

export default build
