import StepFunctions from 'aws-sdk/clients/stepfunctions'

const sf = new StepFunctions()

const stateMachineArn = () => process.env['RESOLVE_CLOUD_SCHEDULER_STEP_FUNCTION_ARN']

const STOP_ERROR_CODE = 'No error'
const STOP_ERROR_CAUSE = 'Scheduler stopped by user'
const EXECUTION_LIST_PAGE_SIZE = 100

export const start = async (entry) => sf
  .startExecution({
    stateMachineArn: stateMachineArn(),
    name: entry.taskId,
    input: JSON.stringify({
      date: (new Date(entry.date)).toISOString(),
      event: {
        resolveSource: 'Scheduler',
        entry
      }
    })
  })
  .promise()

export const stopAll = async () => {
  const processPage = async (token = {}) => {
    const { executions, nextToken } = await sf
      .listExecutions(
        Object.assign({
          stateMachineArn: stateMachineArn(),
          maxResults: EXECUTION_LIST_PAGE_SIZE,
          statusFilter: 'RUNNING'
        }, token)
      )
      .promise()

    await Promise.all(executions.map(({ executionArn }) =>
      sf.stopExecution({
        executionArn,
        cause: STOP_ERROR_CAUSE,
        error: STOP_ERROR_CODE
      }).promise())
    )

    if (nextToken)
      await processPage({ nextToken })
  }

  return processPage()
}
