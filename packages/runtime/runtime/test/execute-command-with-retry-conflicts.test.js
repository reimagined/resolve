import { ConcurrentError } from '@resolve-js/eventstore-base'
import { CommandError } from '../src/common/command'
import { executeCommandWithRetryConflicts } from '../src/common/handlers/command-handler'

test('Execute command should retry 10 times and fail with a ConcurrentError', async () => {
  const event = {
    type: 'TEST',
  }
  const executeCommand = jest.fn()
  for (let retries = 0; retries <= 100; retries++) {
    executeCommand.mockImplementationOnce(async () => {
      throw new ConcurrentError()
    })
  }
  executeCommand.mockImplementationOnce(async () => event)

  const commandArgs = {}
  const jwt = 'JWT_TOKEN'

  try {
    await executeCommandWithRetryConflicts({
      executeCommand,
      commandArgs,
      jwt,
    })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(ConcurrentError)
  }
})

test('Execute command should retry 5 times and returns an event', async () => {
  const event = {
    type: 'TEST',
  }
  const executeCommand = jest.fn()
  for (let retries = 0; retries <= 5; retries++) {
    executeCommand.mockImplementationOnce(async () => {
      throw new ConcurrentError()
    })
  }
  executeCommand.mockImplementationOnce(async () => event)

  const commandArgs = {}
  const jwt = 'JWT_TOKEN'

  const result = await executeCommandWithRetryConflicts({
    executeCommand,
    commandArgs,
    jwt,
  })
  expect(result).toEqual(event)
})

test('Execute command should retry 5 times and fails on immediate conflict', async () => {
  const event = {
    type: 'TEST',
  }
  const executeCommand = jest.fn()
  for (let retries = 0; retries <= 5; retries++) {
    executeCommand.mockImplementationOnce(async () => {
      throw new ConcurrentError()
    })
  }
  executeCommand.mockImplementationOnce(async () => event)

  const commandArgs = {
    immediateConflict: true,
  }
  const jwt = 'JWT_TOKEN'

  try {
    await executeCommandWithRetryConflicts({
      executeCommand,
      commandArgs,
      jwt,
    })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(ConcurrentError)
  }
})

test('Execute command should bypass a command error', async () => {
  const executeCommand = jest.fn()

  executeCommand.mockImplementationOnce(async () => {
    throw new Error('Custom error')
  })

  const commandArgs = {}
  const jwt = 'JWT_TOKEN'

  try {
    await executeCommandWithRetryConflicts({
      executeCommand,
      commandArgs,
      jwt,
    })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error.message).toEqual('Custom error')
  }
})

test.skip('Execute command should bypass a custom error', async () => {
  const executeCommand = jest.fn()

  executeCommand.mockImplementationOnce(async () => {
    throw new CommandError()
  })

  const commandArgs = {}
  const jwt = 'JWT_TOKEN'

  try {
    await executeCommandWithRetryConflicts({
      executeCommand,
      commandArgs,
      jwt,
    })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(CommandError)
  }
})
