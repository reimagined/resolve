import type {
  ExternalMethods,
  ReadModelCursor,
  CallReplicateResult,
} from './types'
import type {
  StoredEventBatchPointer,
  GatheredSecrets,
  EventLoader,
} from '@resolve-js/eventstore-base'
import {
  RequestTimeoutError,
  ServiceBusyError,
  AlreadyDisposedError,
} from '@resolve-js/eventstore-base'
import { getLog } from './get-log'

async function sleep(delay: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

const isHTTPServiceError = (error: any) =>
  error != null &&
  (error.name === 'FetchError' ||
    error.name === 'AbortError' ||
    error.name === 'HttpError')

const getBuildDelay = (iterationNumber: number) => {
  return 30000 * 2 ** iterationNumber
}

const BATCH_PROCESSING_POLL_MS = 50
const PATCH_PROCESSING_TIME_LIMIT = 60 * 1000

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
  if (state.statusAndData.status === 'criticalError') {
    log.error(
      `Refuse to start or continue replication with error state: ${JSON.stringify(
        state.statusAndData.data
      )}`
    )
    return
  } else if (state.statusAndData.status === 'serviceError') {
    await delayNext(getBuildDelay(iterationNumber), state.statusAndData.data)
    return
  }
  if (state.paused) {
    log.warn('Refuse to start or continue replication because it is paused')
    return
  }

  let lockId = `${Date.now()}`
  const timeLeft = getVacantTimeInMillis()
  try {
    const result = await basePool.occupyReplication(basePool, lockId, timeLeft)
    if (result.status === 'alreadyLocked') {
      await delayNext(getBuildDelay(iterationNumber), {
        name: 'Error',
        message: 'Replication process is already locked',
      })
      return
    } else if (result.status === 'serviceError') {
      await delayNext(getBuildDelay(iterationNumber), {
        name: 'Error',
        message: result.message,
      })
      return
    } else if (result.status === 'error') {
      log.error(`Could not occupy replication process: ${result.message}`)
      return
    }
  } catch (error) {
    await delayNext(getBuildDelay(iterationNumber), error)
    return
  }

  let iterator = state.iterator

  await eventstoreAdapter.establishTimeLimit(getVacantTimeInMillis)
  let eventLoader: EventLoader

  const onExit = async () => {
    try {
      if (eventLoader !== undefined) await eventLoader.close()
    } catch (error) {
      log.error(error)
    }
    try {
      await basePool.releaseReplication(basePool, lockId)
    } catch (error) {
      if (!isHTTPServiceError(error)) log.error(error)
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
    if (RequestTimeoutError.is(error) || AlreadyDisposedError.is(error)) {
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
    let lastError: (Error & { recoverable: boolean }) | null = null

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
      if (RequestTimeoutError.is(error) || AlreadyDisposedError.is(error)) {
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
        lockId,
        events,
        existingSecrets,
        deletedSecrets,
        { cursor }
      )

      if (result.type === 'serverError') {
        lastError = {
          recoverable: true,
          name: 'ServiceError',
          message: result.message,
        }
      } else if (result.type === 'clientError') {
        lastError = {
          recoverable: false,
          name: 'Error',
          message: result.message,
        }
      } else if (result.type === 'processed') {
        if (
          result.state === null ||
          result.state.statusAndData.status !== 'batchDone'
        ) {
          lastError = {
            recoverable: false,
            name: 'Error',
            message: 'Reported processed, but status is not batchDone',
          }
        } else {
          iterator = { cursor: nextCursor }
          appliedEventsCount =
            result.state.statusAndData.data.appliedEventsCount
          wasPaused = state.paused
          iterationNumber = 0
        }
      } else if (result.type === 'launched') {
        while (true) {
          const state = await basePool.getReplicationState(basePool)
          if (state.statusAndData.status === 'batchInProgress') {
            if (
              state.statusAndData.data.startedAt + PATCH_PROCESSING_TIME_LIMIT <
              Date.now()
            ) {
              lastError = {
                recoverable: true,
                name: 'Error',
                message: 'Batch took too long to process',
              }
              break
            }
            await sleep(BATCH_PROCESSING_POLL_MS)
          } else if (state.statusAndData.status === 'batchDone') {
            iterator = { cursor: nextCursor }
            appliedEventsCount = state.statusAndData.data.appliedEventsCount
            wasPaused = state.paused
            iterationNumber = 0
            break
          } else if (state.statusAndData.status === 'serviceError') {
            lastError = {
              recoverable: true,
              name: 'ServiceError',
              message: state.statusAndData.data.message,
            }
            break
          } else if (state.statusAndData.status === 'criticalError') {
            lastError = {
              recoverable: false,
              name: 'Error',
              message: state.statusAndData.data.message,
            }
            break
          }
        }
      } else {
        const errorMessage = `Unhandled replicate result. HTTP status code: ${result.httpStatus}. Message: ${result.message}`
        lastError = {
          recoverable: false,
          name: 'Error',
          message: errorMessage,
        }
      }
    } catch (error) {
      lastError = {
        recoverable: isHTTPServiceError(error),
        name: error.name,
        message: error.message,
      }
    }

    if (appliedEventsCount > 0) {
      log.verbose(`Replicated batch of ${appliedEventsCount} events`)
    }

    let delay = 0
    let localContinue = true
    let shouldContinue = appliedEventsCount > 0
    if (lastError) {
      if (lastError.recoverable) {
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
        log.error(
          `Exiting replication loop due to error: ${lastError.name}: ${lastError.message}`
        )
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
