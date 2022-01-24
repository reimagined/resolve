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
  T extends [
    includeRuntimeStatus?: boolean,
    retryTimeoutForRuntimeStatus?: number
  ]
>(
  ...args: AdapterOperationStatusMethodArguments<T, AdapterPool>
): AdapterOperationStatusMethodReturnType<T> => {
  const [pool, readModelName, includeRuntimeStatus] = args
  const state: ReplicationState = await pool.getReplicationState(pool)

  let runStatus: ReadModelRunStatus = ReadModelRunStatus.DELIVER
  if (state.statusAndData.status === 'criticalError') {
    runStatus = ReadModelRunStatus.ERROR
  } else if (state.paused) {
    runStatus = ReadModelRunStatus.SKIP
  }
  let error: Error | null = null

  if (
    state.statusAndData.status === 'criticalError' ||
    state.statusAndData.status === 'serviceError'
  ) {
    error = {
      name: state.statusAndData.data.name ?? 'Error',
      message: state.statusAndData.data.message ?? 'Unknown error',
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
    result = Object.assign(result, {
      isAlive: state.statusAndData.status !== 'criticalError',
    })
  }

  return result as UnPromise<AdapterOperationStatusMethodReturnType<T>>
}

export default status
