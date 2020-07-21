import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:subscriptions-event-handler')

const handleSubscriptionsEvent = async (lambdaEvent, resolve) => {
  return { verified: true }
}

export default handleSubscriptionsEvent
