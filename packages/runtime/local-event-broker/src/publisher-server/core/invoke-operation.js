import {
  PrivateOperationType,
  PublicOperationType,
  LazinessStrategy,
} from '../constants'

const operationTypesMap = new Map([
  [
    PrivateOperationType.PUSH_NOTIFICATIONS,
    'pushNotificationAndGetSubscriptions',
  ],
  [
    PrivateOperationType.PULL_NOTIFICATIONS,
    'pullNotificationsAsBatchForSubscriber',
  ],
  [PrivateOperationType.RESUME_SUBSCRIBER, 'resumeSubscriber'],
  [PrivateOperationType.ACKNOWLEDGE_BATCH, 'acknowledgeBatch'],
  [PrivateOperationType.FINALIZE_BATCH, 'finalizeAndReportBatch'],
  [PrivateOperationType.REQUEST_TIMEOUT, 'requestTimeout'],
  [PrivateOperationType.DELIVER_BATCH, 'deliverBatchForSubscriber'],
  [PublicOperationType.PUBLISH, 'publish'],
  [PublicOperationType.SUBSCRIBE, 'subscribe'],
  [PublicOperationType.RESUBSCRIBE, 'resubscribe'],
  [PublicOperationType.UNSUBSCRIBE, 'unsubscribe'],
  [PublicOperationType.ACKNOWLEDGE, 'acknowledge'],
  [PublicOperationType.STATUS, 'status'],
  [PublicOperationType.RESUME, 'resume'],
  [PublicOperationType.PAUSE, 'pause'],
  [PublicOperationType.RESET, 'reset'],
  [PublicOperationType.READ, 'read'],
])

const invokeOperation = async (pool, laziness, { type, payload }, timeout) => {
  const methodName = operationTypesMap.get(type)
  if (methodName == null) {
    throw new Error(
      `Invalid invoke operation type "${type}" with payload: ${JSON.stringify(
        payload
      )}`
    )
  }

  if (laziness === LazinessStrategy.EAGER) {
    pool.multiplexAsync(pool[methodName].bind(pool), pool, payload)
  } else if (
    laziness === LazinessStrategy.LAZY &&
    !isNaN(+timeout) &&
    +timeout > 0
  ) {
    setTimeout(
      pool.multiplexAsync.bind(
        pool,
        pool[methodName].bind(pool),
        pool,
        payload
      ),
      +timeout
    )
  } else {
    throw new Error(
      `Invalid invoke operation type "${type}" with payload: ${JSON.stringify(
        payload
      )}`
    )
  }
}

export default invokeOperation
