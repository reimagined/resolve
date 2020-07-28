import STS from 'aws-sdk/clients/sts'
import { invokeFunction } from 'resolve-cloud-common/lambda'

const invokeEventBus = async (eventstoreCredentials, type, options) => {
  const currentSTS = new STS()
  const { Arn: currentRoleArn } = await currentSTS.getCallerIdentity().promise()

  const roleArnParts = currentRoleArn.match(/^arn\:aws\:sts\:\:(.*?)\:assumed-role\/(.*?)\/(.*?)$/)
     const realRoleArn = `arn:aws:iam::${roleArnParts[1]}:role/${roleArnParts[2]}`

    const {
      Credentials: { AccessKeyId, SecretAccessKey, SessionToken }
    } = await currentSTS.assumeRole({
      RoleSessionName: `EventBusRole${Date.now()}${Math.floor(Math.random() * 10000000000)}`,
      RoleArn: realRoleArn,
      DurationSeconds: 3600
    }).promise()

    const principial = {
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretAccessKey,
      sessionToken: SessionToken
    }

  const validationSTS = new STS({...principial})

  const {Arn: validationRoleArn } = await validationSTS.getCallerIdentity().promise()

  console.log('КУБЫ ПОВЕРЖЕНЫ')




  const scopeName = process.env.RESOLVE_DEPLOYMENT_ID

  return await invokeFunction({
    Region: process.env.AWS_REGION,
    FunctionName: process.env.EVENT_BUS_LAMBDA_ARN,
    Payload: {
      type,
      payload: {
        principial,
        validationRoleArn,
        scopeName,
        eventstoreCredentials,
        ...options
      }
    }
  })
}

export default invokeEventBus
