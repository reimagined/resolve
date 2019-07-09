import StepFunctions from 'aws-sdk/clients/stepfunctions'
import getLog from './get-log'

const sf = new StepFunctions()

const stateMachineArn = () =>
  process.env['RESOLVE_CLOUD_SCHEDULER_STEP_FUNCTION_ARN']

const STOP_ERROR_CODE = 'No error'
const STOP_ERROR_CAUSE = 'Scheduler stopped by user'
const EXECUTION_LIST_PAGE_SIZE = 100

export const start = async entry => {
  const log = getLog(`step-functions-start`)
  try {
    log.verbose(`entry: ${JSON.stringify(entry)}`)
    log.debug(`starting new execution ${entry.taskId}`)
    await sf
      .startExecution({
        stateMachineArn: stateMachineArn(),
        name: entry.taskId,
        input: JSON.stringify({
          date: new Date(entry.date).toISOString(),
          event: {
            resolveSource: 'Scheduler',
            entry
          }
        })
      })
      .promise()
    log.debug('new execution started successfully')
  } catch (error) {
    if (error.code !== 'ExecutionAlreadyExists') {
      log.error(error.message)
      throw error
    }
  }
}

export const stopAll = async () => {
  const processPage = async (token = {}) => {
    const { executions, nextToken } = await sf
      .listExecutions(
        Object.assign(
          {
            stateMachineArn: stateMachineArn(),
            maxResults: EXECUTION_LIST_PAGE_SIZE,
            statusFilter: 'RUNNING'
          },
          token
        )
      )
      .promise()

    await Promise.all(
      executions.map(({ executionArn }) =>
        sf
          .stopExecution({
            executionArn,
            cause: STOP_ERROR_CAUSE,
            error: STOP_ERROR_CODE
          })
          .promise()
      )
    )

    if (nextToken) await processPage({ nextToken })
  }

  return processPage()
}
