import STS from 'aws-sdk/clients/sts'
import { invokeFunction } from 'resolve-cloud-common/lambda'

const invokeEventBus = async (eventstoreCredentials, type, options) => {
  const principial = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  }

  const {
    Arn: validationRoleArn,
  } = await new STS().getCallerIdentity().promise()

  const scopeName = process.env.RESOLVE_DEPLOYMENT_ID

  return await invokeFunction({
    Region: process.env.AWS_REGION,
    FunctionName: process.env.RESOLVE_EVENT_BUS_LAMBDA_ARN,
    Payload: {
      type,
      payload: {
        principial,
        validationRoleArn,
        scopeName,
        eventstoreCredentials,
        ...options,
      },
    },
  })
}

export default invokeEventBus
