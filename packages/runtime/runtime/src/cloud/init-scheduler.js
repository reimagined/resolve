import pureRequire from '../common/utils/pure-require'
import debugLevels from '@resolve-js/debug-levels'
import { invokeFunction } from 'resolve-cloud-common/lambda'

const getLog = (name) => debugLevels(`resolve:cloud:scheduler:${name}`)

const start = async (entry) => {
  const log = getLog(`start`)
  try {
    log.verbose(`entry: ${JSON.stringify(entry)}`)
    log.debug(`starting new execution ${entry.taskId}`)
    let STS
    try {
      STS = pureRequire('aws-sdk/clients/sts')
    } catch (error) {
      console.log('IMPORT ERROR', error)
    }
    const { Arn } = await new STS().getCallerIdentity().promise()

    await invokeFunction({
      Region: process.env.AWS_REGION,
      FunctionName: process.env.RESOLVE_SCHEDULER_LAMBDA_ARN,
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
  let STS
  try {
    STS = pureRequire('aws-sdk/clients/sts')
  } catch (error) {
    console.log('IMPORT ERROR', error)
  }

  const { Arn } = await new STS().getCallerIdentity().promise()

  await invokeFunction({
    Region: process.env.AWS_REGION,
    FunctionName: process.env.RESOLVE_SCHEDULER_LAMBDA_ARN,
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

const errorHandler = async (error) => {
  throw error
}

const isEmpty = (obj) =>
  Object.keys(obj).reduce(
    (empty, key) => empty && !obj.hasOwnProperty(key),
    true
  )

const validateEntry = ({ date, taskId, command }) =>
  date != null &&
  date.constructor === Number &&
  taskId != null &&
  taskId.constructor === String &&
  command != null &&
  command.constructor === Object &&
  !isEmpty(command)

const initScheduler = (resolve) => {
  getLog('createAdapter').debug(`building new resolve cloud scheduler adapter`)
  resolve.scheduler = {
    async addEntries(data) {
      const log = getLog('addEntries')

      log.debug(`adding new scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = [].concat(data)
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
            resolve.executeSchedulerCommand({
              aggregateName: resolve.domainInterop.sagaDomain.schedulerName,
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

export default initScheduler
