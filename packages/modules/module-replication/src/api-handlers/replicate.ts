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
  let input
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

    res.status(202)
    res.end('Replication has been started')
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
    await req.resolve.broadcastEvent()
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
        log.error(e)
      }
    } else {
      log.debug(error)
    }
  }
}

export default handler
