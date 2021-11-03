import { InternalMethods } from './types'
import { ReplicationState } from '@resolve-js/eventstore-base'
import fetch from 'node-fetch'
import checkTargetUrl from './check-target-url'

import { REPLICATION_STATE } from '@resolve-js/module-replication'

const getReplicationState: InternalMethods['getReplicationState'] = async ({
  targetApplicationUrl,
}): Promise<ReplicationState> => {
  const checkResult = checkTargetUrl(targetApplicationUrl)
  if (checkResult != null) {
    return checkResult
  }

  const defaultValues = {
    paused: false,
    iterator: null,
    successEvent: null,
    locked: false,
  }

  try {
    const response = await fetch(
      `${targetApplicationUrl}${REPLICATION_STATE.endpoint}`
    )
    const state: ReplicationState = await response.json()
    if (response.status >= 400) {
      return {
        status: 'serviceError',
        statusData: {
          name: response.statusText,
          message: (state as any).message ?? response.statusText,
        },
        ...defaultValues,
      }
    }
    return state
  } catch (error) {
    if (
      error.name === 'AbortError' ||
      error.name === 'FetchError' ||
      error.name === 'TypeError'
    ) {
      return {
        status: 'serviceError',
        statusData: {
          name: error.name as string,
          message: error.message as string,
          stack: error.stack ? (error.stack as string) : null,
        },
        ...defaultValues,
      }
    } else {
      return {
        status: 'error',
        statusData: {
          name: error.name as string,
          message: error.message as string,
          stack: error.stack ? (error.stack as string) : null,
        },
        ...defaultValues,
      }
    }
  }
}

export default getReplicationState
