import debugLevels from 'resolve-debug-levels'
import jwt from 'jsonwebtoken'

const log = debugLevels('resolve:resolve-runtime:subscriptions-event-handler')

const handleSubscriptionsEvent = async ({ token }, resolve) => {
  let verifiedToken = null
  try {
    verifiedToken = jwt.verify(token, 'secret')
  } catch (e) {
    log.error(`Failed to verify token`)
    return { verified: false }
  }
  const { applicationArn } = verifiedToken
  const applicationId = applicationArn.split(':')[6].split('-')[0]

  return { verified: true, applicationId }
}

export default handleSubscriptionsEvent
