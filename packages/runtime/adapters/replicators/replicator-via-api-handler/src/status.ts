import { ExternalMethods } from './types'
import { ReplicationState } from '@resolve-js/eventstore-base'
import {
  ReadModelRunStatus,
  ReadModelStatus,
  ReadModelEvent,
} from '@resolve-js/readmodel-base'
import fetch from 'node-fetch'

const status: ExternalMethods['status'] = async (pool, readModelName) => {
  const { targetApplicationUrl } = pool

  const request = await fetch(`${targetApplicationUrl}/api/replication-state`)
  const state: ReplicationState = await request.json()

  let runStatus: ReadModelRunStatus = ReadModelRunStatus.DELIVER
  if (state.status === 'error') {
    runStatus = ReadModelRunStatus.ERROR
  } else if (state.paused) {
    runStatus = ReadModelRunStatus.SKIP
  }

  let error: Error | null = null
  if (state.status === 'error') {
    if (state.statusData == null) {
      error = {
        message: 'Unknown error',
        name: 'Error',
      }
    } else {
      error = {
        name:
          state.statusData.name === undefined
            ? 'Error'
            : (state.statusData.name as string),
        message: state.statusData.message as string,
        stack:
          state.statusData.stack === undefined
            ? (state.statusData.message as string)
            : (state.statusData.stack as string),
      }
    }
  }

  const result: ReadModelStatus = {
    eventSubscriber: '',
    deliveryStrategy: 'inline-ledger',
    successEvent: state.successEvent as ReadModelEvent,
    failedEvent: null,
    errors: error != null ? [error] : null,
    cursor: state.iterator ? (state.iterator.cursor as string) ?? null : null,
    status: runStatus,
  }
  return result
}

export default status
