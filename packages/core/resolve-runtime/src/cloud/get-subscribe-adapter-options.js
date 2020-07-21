import jwt from 'jsonwebtoken'

const SECRET = 'secret'

const getSubscribeAdapterOptions = async ({ subscriptionsCredentials }) => {
  const { RESOLVE_DEPLOYMENT_ID, RESOLVE_WS_URL } = process.env

  const token = jwt.sign(
    {
      applicationArn: subscriptionsCredentials.applicationLambdaArn
    },
    SECRET
  )

  const subscribeUrl = `${RESOLVE_WS_URL}?token=${token}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url: subscribeUrl
  }
}

export default getSubscribeAdapterOptions
