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
    if (response.status >= 400) {
      return {
        statusAndData: {
          status: 'serviceError',
          data: {
            name: response.statusText,
            message: await response.text(),
          },
        },
        ...defaultValues,
      }
    }
    return (await response.json()) as ReplicationState
  } catch (error) {
    if (
      error.name === 'AbortError' ||
      error.name === 'FetchError' ||
      error.name === 'TypeError'
    ) {
      return {
        statusAndData: {
          status: 'serviceError',
          data: {
            name: error.name as string,
            message: error.message as string,
          },
        },
        ...defaultValues,
      }
    } else {
      return {
        statusAndData: {
          status: 'criticalError',
          data: {
            name: error.name as string,
            message: error.message as string,
          },
        },
        ...defaultValues,
      }
    }
  }
}

export default getReplicationState
