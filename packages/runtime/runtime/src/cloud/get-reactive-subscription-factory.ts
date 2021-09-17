import jwt from 'jsonwebtoken'

const getReactiveSubscription = async (
  origin: string,
  eventTypes: string[] | null,
  aggregateIds: string[] | null
) => {
  const {
    RESOLVE_DEPLOYMENT_ID,
    RESOLVE_WS_URL,
    RESOLVE_ENCRYPTED_DEPLOYMENT_ID,
  } = process.env

  const token = jwt.sign(
    { eventTypes, aggregateIds },
    RESOLVE_ENCRYPTED_DEPLOYMENT_ID as string
  )

  const subscribeUrl = `${RESOLVE_WS_URL}?deploymentId=${RESOLVE_DEPLOYMENT_ID}&token=${token}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID as string,
    url: subscribeUrl,
  }
}

export const getReactiveSubscriptionFactory = () => getReactiveSubscription
