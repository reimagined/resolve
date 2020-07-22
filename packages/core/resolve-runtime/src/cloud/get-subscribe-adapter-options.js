import jwt from 'jsonwebtoken'
import qs from 'querystring'

const SECRET = 'secret'

const getSubscribeAdapterOptions = async ({ subscriptionsCredentials }) => {
  const { RESOLVE_DEPLOYMENT_ID, RESOLVE_WS_URL } = process.env

  const token = jwt.sign(
    {
      applicationArn: subscriptionsCredentials.applicationLambdaArn
    },
    SECRET
  )

  const query = qs.stringify({
    token,
    applicationArn: subscriptionsCredentials.applicationLambdaArn
  })

  const subscribeUrl = `${RESOLVE_WS_URL}?${query}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url: subscribeUrl
  }
}

export default getSubscribeAdapterOptions
