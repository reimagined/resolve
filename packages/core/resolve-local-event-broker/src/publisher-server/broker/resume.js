import {
  LazinessStrategy,
  SUBSCRIBERS_TABLE_NAME,
  SubscriptionStatus,
  PrivateOperationType,
  DeliveryStrategy,
  ConsumerMethod
} from '../constants'

const resume = async (pool, payload) => {
  const {
    database: { runQuery, escapeId, escapeStr },
    invokeOperation,
    parseSubscription,
    invokeConsumer
  } = pool
  const { eventSubscriber } = payload
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const input = {
    type: PrivateOperationType.RESUME_SUBSCRIBER,
    payload: {
      eventSubscriber
    }
  }
  await invokeOperation(pool, LazinessStrategy.EAGER, input)

  for (let attempt = 0; ; attempt++) {
    const result = await runQuery(`
      SELECT ${subscribersTableNameAsId}."status" AS "status",
      ${subscribersTableNameAsId}."subscriptionId" AS "subscriptionId",
      ${subscribersTableNameAsId}."deliveryStrategy" AS "deliveryStrategy",
      ${subscribersTableNameAsId}."eventTypes" AS "eventTypes",
      ${subscribersTableNameAsId}."aggregateIds" AS "aggregateIds"
      FROM ${subscribersTableNameAsId}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
    `)
    if (result == null || result.length !== 1) {
      throw new Error(`Event subscriber ${eventSubscriber} does not found`)
    }
    const {
      status,
      subscriptionId,
      deliveryStrategy,
      eventTypes,
      aggregateIds
    } = parseSubscription(result[0])
    if (status === SubscriptionStatus.ERROR) {
      throw new Error(`Event subscriber ${eventSubscriber} is in error state`)
    } else if (status === SubscriptionStatus.DELIVER) {
      if (deliveryStrategy === DeliveryStrategy.PASSIVE) {
        await invokeConsumer(pool, ConsumerMethod.Notify, {
          eventSubscriber: payload.eventSubscriber,
          notification: 'RESUME',
          eventTypes,
          aggregateIds
        })
      }

      return subscriptionId
    } else if (status === SubscriptionStatus.SKIP && attempt > 10) {
      throw new Error(
        `Event subscriber ${eventSubscriber} cannot be resumed after ${attempt} attempts - event bus is too busy`
      )
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}
export default resume
