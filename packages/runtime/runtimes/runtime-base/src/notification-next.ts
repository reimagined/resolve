import type { InvokeBuildAsync, BuildDirectContinuation } from './types'

const nextBuildDirectInvoke = async (
  invokeBuildAsync: InvokeBuildAsync,
  eventSubscriber: string,
  timeout?: number,
  notificationExtraPayload?: object,
  ...args: any[]
) => {
  if (args.length > 0) {
    throw new TypeError('Next should be invoked with no arguments')
  }
  if (timeout != null && (isNaN(+timeout) || +timeout < 0)) {
    throw new TypeError('Timeout should be non-negative integer')
  }
  if (
    notificationExtraPayload != null &&
    notificationExtraPayload.constructor !== Object
  ) {
    throw new TypeError('Notification extra payload should be plain object')
  }

  await invokeBuildAsync(
    {
      eventSubscriber,
      initiator: 'read-model-next',
      notificationId: `NT-${Date.now()}${Math.floor(Math.random() * 1000000)}`,
      sendTime: Date.now(),
      ...notificationExtraPayload,
    },
    timeout != null ? Math.floor(+timeout) : timeout
  )
}

const nextNotification = async (
  invokeBuildAsync: InvokeBuildAsync,
  notification: BuildDirectContinuation,
  eventSubscriberName: string
): Promise<void> => {
  if (notification.type === 'build-direct-invoke') {
    await nextBuildDirectInvoke(
      invokeBuildAsync,
      eventSubscriberName,
      notification.payload.timeout,
      notification.payload.notificationExtraPayload
    )
  } else {
    // TODO ???
  }
}

export default nextNotification
