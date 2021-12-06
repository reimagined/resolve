import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'
import { getLog } from './get-log'

const checkInput = (input: any) => {
  if (!Array.isArray(input.events)) {
    throw new Error('Events must be array')
  }
  if (!Array.isArray(input.secretsToSet)) {
    throw new Error('Secrets to set must be array')
  }
  if (!Array.isArray(input.secretsToDelete)) {
    throw new Error('Secrets to delete must be array')
  }
  if (input.iterator == null) {
    throw new Error('Iterator must be non-null object')
  }
}

function shouldSaveError(error: any) {
  return (
    error != null &&
    error.name !== 'ServiceBusyError' &&
    error.name !== 'RequestTimeoutError' &&
    error.name !== 'AlreadyDisposedError'
  )
}

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  let input: any
  try {
    input = JSON.parse(req.body ?? '')
    checkInput(input)
  } catch (error) {
    res.status(400)
    res.end(error.message)
    return
  }

  const log = getLog('replicate')
  try {
    await req.resolve.eventstoreAdapter.setReplicationStatus({
      statusAndData: {
        status: 'batchInProgress',
        data: {
          startedAt: Date.now(),
        },
      },
      iterator: input.iterator,
    })

    type ReplicationOperationResult = {
      status: 'timeout' | 'success' | 'error'
      message: string
    }

    const replicateData = async (): Promise<ReplicationOperationResult> => {
      let result: ReplicationOperationResult = {
        status: 'error',
        message: 'Uninitialized error',
      }
      try {
        await req.resolve.eventstoreAdapter.replicateSecrets(
          input.secretsToSet,
          input.secretsToDelete
        )
        await req.resolve.eventstoreAdapter.replicateEvents(input.events)
        await req.resolve.eventstoreAdapter.setReplicationStatus({
          statusAndData: {
            status: 'batchDone',
            data: {
              appliedEventsCount: input.events.length,
            },
          },
          lastEvent: input.events[input.events.length - 1],
        })
        result = {
          status: 'success',
          message: `Completed replication of ${input.events.length} events`,
        }
      } catch (error) {
        result.message = error.message
        if (shouldSaveError(error)) {
          try {
            await req.resolve.eventstoreAdapter.setReplicationStatus({
              statusAndData: {
                status: 'criticalError',
                data: {
                  name: error.name ?? 'Error',
                  message: error.message ?? 'Unknown error',
                },
              },
            })
          } catch (e) {
            log.error(e)
          }
        } else {
          log.debug(error)
        }
      } finally {
        try {
          if (result.status === 'success') await req.resolve.broadcastEvent()
        } catch (error) {
          log.error('broadcastEvent error: ', error)
        }
      }
      return result
    }

    type TimerInfo = {
      timeout: NodeJS.Timeout | null
      timeoutResolve: ((value: ReplicationOperationResult) => void) | null
      timeoutPromise: Promise<ReplicationOperationResult>
    }

    const makeTimer = (): TimerInfo => {
      const timerInfo: Partial<TimerInfo> = {
        timeout: null,
        timeoutResolve: null,
      }

      timerInfo.timeoutPromise = new Promise<ReplicationOperationResult>(
        (resolve) => {
          timerInfo.timeoutResolve = resolve
          timerInfo.timeout = setTimeout(
            () =>
              resolve({
                status: 'timeout',
                message: `Batch of ${input.events.length} events took too long to process to respond in place. Continuing replication in background.`,
              }),
            5000
          )
        }
      )
      return timerInfo as TimerInfo
    }
    const timerInfo = makeTimer()

    const result = await Promise.race([
      timerInfo.timeoutPromise,
      replicateData(),
    ])
    if (result.status !== 'timeout') {
      if (timerInfo.timeout !== null) {
        clearTimeout(timerInfo.timeout)
        timerInfo.timeout = null
      }
      if (timerInfo.timeoutResolve !== null) {
        timerInfo.timeoutResolve({
          status: 'timeout',
          message: 'Resolving timeout promise',
        })
        timerInfo.timeoutResolve = null
      }
    }
    if (result.status === 'timeout') {
      res.status(202)
    } else if (result.status === 'success') {
      res.status(200)
    } else if (result.status === 'error') {
      res.status(500)
    }
    res.end(result.message)
  } catch (error) {
    if (shouldSaveError(error)) {
      try {
        await req.resolve.eventstoreAdapter.setReplicationStatus({
          statusAndData: {
            status: 'criticalError',
            data: {
              name: error.name ?? 'Error',
              message: error.message ?? 'Unknown error',
            },
          },
        })
      } catch (e) {
        error.message += '\n'
        error.message += e.message
      }
    } else {
      log.debug(error)
    }

    res.status(500)
    res.end(error.message)
    return
  }
}

export default handler
