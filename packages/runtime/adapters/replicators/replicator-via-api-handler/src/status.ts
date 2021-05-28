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

  let state: ReplicationState
  try {
    const response = await fetch(
      `${targetApplicationUrl}/api/replication-state`
    )
    state = await response.json()
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'FetchError') {
      const readModelStatus: ReadModelStatus = {
        eventSubscriber: '',
        deliveryStrategy: 'inline-ledger',
        successEvent: null,
        failedEvent: { type: error.name } as ReadModelEvent,
        errors: error ? [error] : null,
        cursor: null,
        status: ReadModelRunStatus.ERROR,
      }
      return readModelStatus
    } else {
      throw error
    }
  }

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
    successEvent:
      state.successEvent != null
        ? (state.successEvent as ReadModelEvent)
        : ({
            type: 'Init',
          } as ReadModelEvent),
    failedEvent: null,
    errors: error != null ? [error] : null,
    cursor: state.iterator ? (state.iterator.cursor as string) ?? null : null,
    status: runStatus,
  }
  return result
}

export default status
