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
  ConnectionError,
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

const BATCH_PROCESSING_POLL_MS = 50

const build: ExternalMethods['build'] = async (
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis
) => {
  const log = getLog('build')

  await eventstoreAdapter.establishTimeLimit(getVacantTimeInMillis)

  const state = await basePool.getReplicationState(basePool)
  if (state.status === 'error') {
    log.error('Refuse to start or continue replication with error state')
    return
  }
  if (state.paused) {
    log.warn('Refuse to start or continue replication because it is paused')
    return
  }

  let iterator = state.iterator
  let localContinue = true
  const sleepAfterServiceErrorMs = 3000

  let eventLoader: EventLoader
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
    if (RequestTimeoutError.is(error) || ServiceBusyError.is(error)) {
      log.debug(
        `Got non-fatal error, continuing on the next step. ${error.message}`
      )
      await next()
      return
    } else if (ConnectionError.is(error)) {
      log.error(error)
      return
    } else {
      throw error
    }
  }

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
      if (RequestTimeoutError.is(error) || ServiceBusyError.is(error)) {
        log.debug(
          `Got non-fatal error, continuing on the next step. ${error.message}`
        )
        await next()
        break
      } else {
        await eventLoader.close()
        throw error
      }
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

    const isBuildSuccess = lastError == null && appliedEventsCount > 0

    if (isBuildSuccess) {
      log.verbose(`Replicated batch of ${appliedEventsCount} events`)
    }

    if (lastError) {
      log.error(lastError)
      if (
        lastError.name === 'ServiceError' ||
        lastError.name === 'AbortError' ||
        lastError.name === 'FetchError'
      ) {
        const vacantTime = getVacantTimeInMillis()
        if (vacantTime > 0) {
          await sleep(Math.min(vacantTime, sleepAfterServiceErrorMs))
        }
      }
    }

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && wasPaused) {
      log.debug('Pausing replication as requested')
      break
    }

    if (isBuildSuccess && localContinue) {
      log.debug('Continuing replication in the local build loop')
    } else {
      if (isBuildSuccess) {
        log.debug('Calling next in build')
        await next()
      }
      break
    }
  }
  await eventLoader.close()
}

export default build
