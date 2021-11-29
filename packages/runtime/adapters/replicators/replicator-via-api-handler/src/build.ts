import type {
  ExternalMethods,
  ReadModelCursor,
  CallReplicateResult,
} from './types'
import type {
  ReplicationState,
  StoredEventBatchPointer,
  GatheredSecrets,
  EventLoader,
} from '@resolve-js/eventstore-base'
import {
  RequestTimeoutError,
  ServiceBusyError,
} from '@resolve-js/eventstore-base'
import { getLog } from './get-log'

async function sleep(delay: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

function statusDataToError(
  statusData: ReplicationState['statusData'],
  defaults: { message: string; name: string }
): Error {
  const errorMessage =
    statusData != null && statusData.message != null
      ? (statusData.message as string)
      : defaults.message
  const errorName =
    statusData != null && statusData.name != null
      ? (statusData.name as string)
      : defaults.name
  const errorStack =
    statusData != null && statusData.stack != null
      ? (statusData.stack as string)
      : undefined
  if (errorStack) {
    return {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
    }
  } else {
    return {
      message: errorMessage,
      name: errorName,
    }
  }
}

const isHTTPServiceError = (name: string) =>
  name === 'FetchError' || name === 'AbortError' || name === 'ServiceError'

const getBuildDelay = (iterationNumber: number) => {
  return 30000 * 2 ** iterationNumber
}

const BATCH_PROCESSING_POLL_MS = 50

const build: ExternalMethods['build'] = async (
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis,
  buildInfo
) => {
  const log = getLog('build')

  let iterationNumber = buildInfo.iterationNumber ?? 0

  const delayNext = async (delay: number, error: any) => {
    log.debug(
      `Delaying next for ${delay}ms due to service error ${
        error ? error.name + ': ' + error.message : ''
      }`
    )
    await next(delay, { iterationNumber: iterationNumber + 1 })
  }

  const state = await basePool.getReplicationState(basePool)
  if (state.status === 'error') {
    log.error(
      `Refuse to start or continue replication with error state: ${JSON.stringify(
        state.statusData
      )}`
    )
    return
  } else if (state.status === 'serviceError') {
    await delayNext(getBuildDelay(iterationNumber), state.statusData)
    return
  }
  if (state.paused) {
    log.warn('Refuse to start or continue replication because it is paused')
    return
  }

  const timeLeft = getVacantTimeInMillis()
  try {
    const result = await basePool.occupyReplication(basePool, timeLeft)
    if (!result.success) {
      log.error(`Could not occupy replication process: ${result.message}`)
      return
    }
  } catch (error) {
    await delayNext(getBuildDelay(iterationNumber), error)
    return
  }

  let iterator = state.iterator
  let localContinue = true

  await eventstoreAdapter.establishTimeLimit(getVacantTimeInMillis)
  let eventLoader: EventLoader

  const onExit = async () => {
    try {
      if (eventLoader !== undefined) await eventLoader.close()
    } catch (error) {
      log.error(error)
    }
    try {
      await basePool.releaseReplication(basePool)
    } catch (error) {
      if (!isHTTPServiceError(error.name)) log.error(error)
    }
  }

  try {
    eventLoader = await eventstoreAdapter.getEventLoader(
      {
        cursor: iterator == null ? null : (iterator.cursor as ReadModelCursor),
      },
      { preferRegular: basePool.preferRegularLoader }
    )
    log.debug(
      eventLoader.isNative
        ? 'Using native event loader'
        : 'Using regular event loader'
    )
  } catch (error) {
    await onExit()
    if (RequestTimeoutError.is(error)) {
      await next()
    } else if (ServiceBusyError.is(error)) {
      await delayNext(getBuildDelay(iterationNumber), error)
    } else {
      log.error(error)
    }
    return
  }

  log.debug('Starting or continuing replication process')

  while (true) {
    let lastError: Error | null = null

    const cursor =
      iterator == null ? null : (iterator.cursor as ReadModelCursor)

    let loadEventsResult: StoredEventBatchPointer
    let gatheredSecrets: GatheredSecrets

    try {
      loadEventsResult = await eventLoader.loadEvents(100)
      gatheredSecrets = await eventstoreAdapter.gatherSecretsFromEvents(
        loadEventsResult.events
      )
    } catch (error) {
      await onExit()
      if (RequestTimeoutError.is(error)) {
        await next()
      } else if (ServiceBusyError.is(error)) {
        await delayNext(getBuildDelay(iterationNumber), error)
      } else {
        log.error(error)
      }
      return
    }
    const { cursor: nextCursor, events } = loadEventsResult
    const { existingSecrets, deletedSecrets } = gatheredSecrets

    let appliedEventsCount = 0
    let wasPaused = false

    try {
      log.verbose(`Calling replicate on ${events.length} events`)

      const result: CallReplicateResult = await basePool.callReplicate(
        basePool,
        events,
        existingSecrets,
        deletedSecrets,
        { cursor }
      )

      if (result.type === 'serverError') {
        lastError = { name: 'ServiceError', message: result.message }
      } else if (result.type === 'clientError') {
        lastError = { name: 'Error', message: result.message }
      } else if (result.type === 'launched') {
        while (true) {
          const state = await basePool.getReplicationState(basePool)
          if (state.status === 'batchInProgress') {
            await sleep(BATCH_PROCESSING_POLL_MS)
          } else if (state.status === 'batchDone') {
            iterator = { cursor: nextCursor }
            appliedEventsCount =
              state.statusData != null
                ? (state.statusData.appliedEventsCount as number)
                : 0
            wasPaused = state.paused
            iterationNumber = 0
            break
          } else if (state.status === 'serviceError') {
            lastError = statusDataToError(state.statusData, {
              message: 'Unknown service error',
              name: 'ServiceError',
            })
            break
          } else if (state.status === 'error') {
            lastError = statusDataToError(state.statusData, {
              message: 'Unknown error',
              name: 'Error',
            })
            break
          }
        }
      } else {
        const errorMessage = `Unhandled replicate result. HTTP status code: ${result.httpStatus}. Message: ${result.message}`
        lastError = { name: 'Error', message: errorMessage }
      }
    } catch (error) {
      lastError = error
    }

    if (appliedEventsCount > 0) {
      log.verbose(`Replicated batch of ${appliedEventsCount} events`)
    }

    let delay = 0
    let shouldContinue = appliedEventsCount > 0
    if (lastError) {
      if (isHTTPServiceError(lastError.name)) {
        delay = getBuildDelay(iterationNumber)
        shouldContinue = true
        localContinue = false
      } else {
        shouldContinue = false
      }
    }

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (wasPaused) {
      log.debug('Pausing replication as requested')
      await onExit()
      return
    }

    if (shouldContinue && localContinue && delay === 0) {
      log.verbose('Continuing replication in the local build loop')
    } else {
      await onExit()
      if (lastError)
        log.error(`Exiting replication loop due to error ${lastError.message}`)
      if (shouldContinue) {
        if (delay > 0) {
          await delayNext(delay, lastError)
        } else {
          await next()
        }
      }
      return
    }
  }
}

export default build
