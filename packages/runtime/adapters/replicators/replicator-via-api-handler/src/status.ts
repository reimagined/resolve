import { ExternalMethods, AdapterPool } from './types'
import { ReplicationState } from '@resolve-js/eventstore-base'
import {
  AdapterOperationStatusMethodArguments,
  AdapterOperationStatusMethodReturnType,
  RuntimeReadModelStatus,
  ReadModelRunStatus,
  ReadModelStatus,
  ReadModelEvent,
  UnPromise,
} from '@resolve-js/readmodel-base'

const status: ExternalMethods['status'] = async <
  T extends [includeRuntimeStatus?: boolean]
>(
  ...args: AdapterOperationStatusMethodArguments<T, AdapterPool>
): AdapterOperationStatusMethodReturnType<T> => {
  const [pool, readModelName, eventstoreAdapter, includeRuntimeStatus] = args
  const state: ReplicationState = await pool.getReplicationState(pool)

  let runStatus: ReadModelRunStatus = ReadModelRunStatus.DELIVER
  if (state.status === 'error') {
    runStatus = ReadModelRunStatus.ERROR
  } else if (state.paused) {
    runStatus = ReadModelRunStatus.SKIP
  }
  let error: Error | null = null
  if (state.status === 'error' || state.status === 'serviceError') {
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

  let result: ReadModelStatus | RuntimeReadModelStatus | null = {
    eventSubscriber: readModelName,
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
  if (includeRuntimeStatus) {
    void eventstoreAdapter // TODO real replicator status
    result = Object.assign(result, { isAlive: true })
  }

  return result as UnPromise<AdapterOperationStatusMethodReturnType<T>>
}

export default status
