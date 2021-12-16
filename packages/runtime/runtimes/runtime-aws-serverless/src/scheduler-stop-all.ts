// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import { pureRequire } from '@resolve-js/runtime-base'

import { getLog } from './scheduler-logger'

export const stopAll = async () => {
  const log = getLog(`stop all`)

  log.debug('stopping all executions')

  let STS: any
  let invokeFunction: any
  try {
    void ({ default: STS } = interopRequireDefault(
      pureRequire('aws-sdk/clients/sts')
    ))
    void ({ invokeFunction } = interopRequireDefault(
      pureRequire('resolve-cloud-common/lambda')
    ))
  } catch {}

  const { Arn } = await new STS().getCallerIdentity().promise()

  await invokeFunction({
    Region: process.env.AWS_REGION as string,
    FunctionName: process.env.RESOLVE_SCHEDULER_LAMBDA_ARN as string,
    Payload: {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      validationRoleArn: Arn,
      principial: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    },
  })

  log.debug('all executions stopped successfully')
}
