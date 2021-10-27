import { ReplicationState } from '@resolve-js/eventstore-base'

const checkTargetUrl = (
  targetApplicationUrl: string
): ReplicationState | null => {
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
      locked: false,
    }
  }
  return null
}

export default checkTargetUrl
