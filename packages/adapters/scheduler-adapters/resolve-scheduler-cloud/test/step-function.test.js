import { start, stopAll } from '../src/step-function'
import StepFunctions from 'aws-sdk/clients/stepfunctions'

const {
  startExecution: awsStartExecution,
  stopExecution: awsStopExecution,
  listExecutions: awsListExecutions
} = StepFunctions.prototype

const mockReturnPromiseOnce = (fn, value) =>
  fn.mockReturnValueOnce({
    promise: () => Promise.resolve(value)
  })

const mockRejectedPromiseOnce = (fn, value) =>
  fn.mockReturnValueOnce({
    promise: () => Promise.reject(value)
  })

beforeEach(() => {
  process.env['RESOLVE_CLOUD_SCHEDULER_STEP_FUNCTION_ARN'] = 'step-function-arn'
})

afterEach(() => {
  awsStartExecution.mockClear()
  awsStopExecution.mockClear()
  awsListExecutions.mockClear()
})

describe('start', () => {
  let createEntry = salt => ({
    date: new Date(2019, 4, 5, 17, 30, 5, 15).getTime(),
    taskId: `taskId_${salt}`,
    command: { salt }
  })

  test('start execution for an entry', async () => {
    const entry = createEntry('a')

    await start(entry)

    expect(awsStartExecution).toHaveBeenCalledWith({
      stateMachineArn: 'step-function-arn',
      name: 'taskId_a',
      input: JSON.stringify({
        date: '2019-05-05T14:30:05.015Z',
        event: {
          resolveSource: 'Scheduler',
          entry
        }
      })
    })
  })

  test('catch duplicate execution errors', async () => {
    mockRejectedPromiseOnce(awsStartExecution, {
      code: 'ExecutionAlreadyExists'
    })

    await start(createEntry('a'))
  })
})

describe('stopAll', () => {
  const createExecution = (executionArn, name) => ({
    name,
    executionArn,
    stateMachineArn: 'state-machine-arn',
    status: 'RUNNING',
    startDate: new Date()
  })

  test('stop one execution', async () => {
    mockReturnPromiseOnce(awsListExecutions, {
      executions: [createExecution('execution-arn', 'name_a')]
    })

    await stopAll()

    expect(awsListExecutions).toHaveBeenCalledWith({
      stateMachineArn: 'step-function-arn',
      maxResults: expect.any(Number),
      statusFilter: 'RUNNING'
    })
    expect(awsStopExecution).toHaveBeenCalledWith({
      executionArn: 'execution-arn',
      cause: expect.any(String),
      error: expect.any(String)
    })
  })

  test('stop multiple executions', async () => {
    mockReturnPromiseOnce(awsListExecutions, {
      executions: [
        createExecution('execution-arn-a', 'name_a'),
        createExecution('execution-arn-b', 'name_b')
      ]
    })

    await stopAll()

    expect(awsStopExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        executionArn: 'execution-arn-a'
      })
    )
    expect(awsStopExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        executionArn: 'execution-arn-b'
      })
    )
  })

  test('follow paged executions list', async () => {
    mockReturnPromiseOnce(awsListExecutions, {
      executions: [createExecution('execution-arn-a', 'name_a')],
      nextToken: 'next-token'
    })
    mockReturnPromiseOnce(awsListExecutions, {
      executions: [createExecution('execution-arn-b', 'name_b')]
    })

    await stopAll()

    expect(awsListExecutions.mock.calls.length).toEqual(2)
    expect(awsListExecutions).toHaveBeenCalledWith(
      expect.objectContaining({
        nextToken: 'next-token'
      })
    )
    expect(awsStopExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        executionArn: 'execution-arn-a'
      })
    )
    expect(awsStopExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        executionArn: 'execution-arn-b'
      })
    )
  })
})
