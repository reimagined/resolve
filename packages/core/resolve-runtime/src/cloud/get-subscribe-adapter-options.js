import jwt from 'jsonwebtoken'

const getSubscribeAdapterOptions = async (
  resolve,
  origin,
  eventTypes,
  aggregateIds
) => {
  const {
    RESOLVE_DEPLOYMENT_ID,
    RESOLVE_WS_URL,
    RESOLVE_ENCRYPTED_DEPLOYMENT_ID,
  } = process.env

  const token = jwt.sign(
    { eventTypes, aggregateIds },
    RESOLVE_ENCRYPTED_DEPLOYMENT_ID
  )

  const subscribeUrl = `${RESOLVE_WS_URL}?deploymentId=${RESOLVE_DEPLOYMENT_ID}&token=${token}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url: subscribeUrl,
  }
}

export default getSubscribeAdapterOptions
