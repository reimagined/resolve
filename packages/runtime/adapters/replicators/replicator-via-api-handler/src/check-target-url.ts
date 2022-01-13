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
      statusAndData: {
        status: 'criticalError',
        data: {
          name: 'Error',
          message:
            'Invalid target application url: empty or not a string. The replication is no-op',
        },
      },
      paused: false,
      iterator: null,
      successEvent: null,
      locked: false,
      lockId: null,
    }
  }
  return null
}

export default checkTargetUrl
