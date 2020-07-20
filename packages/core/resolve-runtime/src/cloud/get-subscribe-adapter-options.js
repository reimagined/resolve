import qs from 'querystring'

const getSubscribeAdapterOptions = async ({ sts }) => {
  const {
    RESOLVE_DEPLOYMENT_ID,
    RESOLVE_WS_URL,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN
  } = process.env

  const { Arn: validationRoleArn } = await sts.getCallerIdentity().promise()

  const queryString = qs.stringify({
    validationRoleArn,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    sessionToken: AWS_SESSION_TOKEN,
    applicationId: RESOLVE_DEPLOYMENT_ID
  })

  const subscribeUrl = `${RESOLVE_WS_URL}?${queryString}`

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url: subscribeUrl
  }
}

export default getSubscribeAdapterOptions
