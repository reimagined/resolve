import v4 from 'aws-signature-v4'

const getSubscribeAdapterOptions = async ({ sts }) => {
  const {
    RESOLVE_DEPLOYMENT_ID,
    RESOLVE_WS_ENDPOINT,
    RESOLVE_IOT_ROLE_ARN
  } = process.env

  const data = await sts
    .assumeRole({
      RoleArn: RESOLVE_IOT_ROLE_ARN,
      RoleSessionName: `role-session-${RESOLVE_DEPLOYMENT_ID}`,
      DurationSeconds: 3600
    })
    .promise()

  const url = v4.createPresignedURL(
    'GET',
    RESOLVE_WS_ENDPOINT,
    '/mqtt',
    'iotdevicegateway',
    '',
    {
      key: data.Credentials.AccessKeyId,
      secret: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      protocol: 'wss'
    }
  )

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url
  }
}

export default getSubscribeAdapterOptions
