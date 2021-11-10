import { getLog as getBaseLog } from '@resolve-js/runtime-base'
import pureRequire from './pure-require'

import type {
  SchedulerEntry,
  Scheduler,
  Runtime,
} from '@resolve-js/runtime-base'

const getLog = (name: string) => getBaseLog(`scheduler:${name}`)

const start = async (entry: SchedulerEntry) => {
  const log = getLog(`start`)
  try {
    log.verbose(`entry: ${JSON.stringify(entry)}`)
    log.debug(`starting new execution ${entry.taskId}`)
    let STS: any
    let invokeFunction: any
    try {
      STS = pureRequire('aws-sdk/clients/sts')
      invokeFunction = pureRequire('resolve-cloud-common/lambda')
    } catch{}

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

const stopAll = async () => {
  const log = getLog(`stop all`)

  log.debug('stopping all executions')

  let STS: any
  let invokeFunction: any
  try {
    STS = pureRequire('aws-sdk/clients/sts')
    invokeFunction = pureRequire('resolve-cloud-common/lambda')
  } catch{}

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

const errorHandler = async (error: any) => {
  throw error
}

const isEmpty = (obj: any) =>
  Object.keys(obj).reduce(
    (empty, key) => empty && !obj.hasOwnProperty(key),
    true
  )

const validateEntry = ({ date, taskId, command }: SchedulerEntry) =>
  date != null &&
  date.constructor === Number &&
  taskId != null &&
  taskId.constructor === String &&
  command != null &&
  command.constructor === Object &&
  !isEmpty(command)

export const schedulerFactory = (
  runtime: Runtime,
  schedulerName: string
): Scheduler => {
  getLog('createAdapter').debug(`building new resolve cloud scheduler adapter`)
  return {
    async addEntries(data) {
      const log = getLog('addEntries')

      log.debug(`adding new scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = ([] as SchedulerEntry[]).concat(data)
      try {
        log.debug(`starting step function executions`)
        await Promise.all(
          entries.map((entry) =>
            validateEntry(entry)
              ? start(entry)
              : errorHandler(Error(`invalid entry ${JSON.stringify(entry)}`))
          )
        )
        log.debug(`entries were successfully added`)
      } catch (e) {
        log.error(e.message)
        await errorHandler(e)
      }
    },
    async clearEntries() {
      const log = getLog('clearEntries')

      log.debug(`step functions cannot be recreated, skipping clearing`)

      await stopAll()
    },
    async executeEntries(data) {
      const log = getLog('executingEntries')

      log.debug(`executing scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = [].concat(data)
      try {
        log.debug(`executing tasks`)
        await Promise.all(
          entries.map(({ taskId, date, command }) =>
            runtime.executeSchedulerCommand({
              aggregateName: schedulerName,
              aggregateId: taskId,
              type: 'execute',
              payload: { date, command },
            })
          )
        )
        log.debug(`tasks were successfully executed`)
      } catch (e) {
        log.error(e.message)
        await errorHandler(e)
      }
    },
  }
}
