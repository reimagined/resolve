// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import type { SchedulerEntry } from '@resolve-js/runtime-base'
import { pureRequire } from '@resolve-js/runtime-base'

import { getLog } from './scheduler-logger'

export const start = async (entry: SchedulerEntry) => {
  const log = getLog(`start`)
  try {
    log.verbose(`entry: ${JSON.stringify(entry)}`)
    log.debug(`starting new execution ${entry.taskId}`)
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
        event: {
          resolveSource: 'Scheduler',
          entry,
        },
        date: new Date(entry.date).toISOString(),
        validationRoleArn: Arn,
        principial: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      },
    })

    log.debug('new execution started successfully')
  } catch (error) {
    if (error.code !== 'ExecutionAlreadyExists') {
      log.error(error.message)
      throw error
    }
  }
}
