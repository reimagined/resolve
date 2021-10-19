import { InternalMethods } from './types'
import { ReplicationState } from '@resolve-js/eventstore-base'
import fetch from 'node-fetch'

import { REPLICATION_STATE } from '@resolve-js/module-replication'

const getReplicationState: InternalMethods['getReplicationState'] = async ({
  targetApplicationUrl,
}) => {
  if (
    targetApplicationUrl == null ||
    targetApplicationUrl.constructor !== String ||
    targetApplicationUrl.length === 0
  ) {
    return {
      status: 'error',
      statusData: {
        name: 'Error',
        message:
          'Invalid target application url: empty or not a string. The replication is no-op',
      },
      paused: false,
      iterator: null,
      successEvent: null,
    }
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
        paused: false,
        iterator: null,
        successEvent: null,
      }
    }
    return state
  } catch (error) {
    if (
      error.name === 'AbortError' ||
      error.name === 'FetchError' ||
      error.name === 'TypeError'
    ) {
      const state: ReplicationState = {
        status: 'serviceError',
        statusData: {
          name: error.name as string,
          message: error.message as string,
          stack: error.stack ? (error.stack as string) : null,
        },
        paused: false,
        iterator: null,
        successEvent: null,
      }
      return state
    } else {
      throw error
    }
  }
}

export default getReplicationState
