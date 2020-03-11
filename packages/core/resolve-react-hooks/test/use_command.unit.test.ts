import { useContext, useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Command, getClient } from 'resolve-client'
import { CommandCallbacks, useCommand } from '../src/use_command'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => 'mocked-context'),
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedGetApi = mocked(getClient)
const mockedUseContext = mocked(useContext)
const mockedUseCallback = mocked(useCallback)

const mockedClient = {
  command: jest.fn(() => Promise.resolve({ result: 'command-result' })),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  subscribeTo: jest.fn(),
  unsubscribe: jest.fn()
}
const basicCommand = (): Command => ({
  type: 'create',
  aggregateName: 'user',
  aggregateId: 'new',
  payload: {
    name: 'username'
  }
})

const clearMocks = () => {
  mockedGetApi.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()

  mockedClient.command.mockClear()
}

beforeAll(() => {
  mockedGetApi.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

test('client requested for specified context', () => {
  useCommand(basicCommand())

  expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
  expect(getClient).toHaveBeenCalledWith('mocked-context')
})

test('simple usage: command passed as is', () => {
  const command = basicCommand()

  useCommand(command)()

  expect(mockedClient.command).toHaveBeenCalledWith(command, undefined)
})

test('default dependency should be the command itself', () => {
  const command = basicCommand()

  useCommand(command)

  expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
    'mocked-context',
    command
  ])
})

test('specifying dependencies', () => {
  useCommand(basicCommand(), ['dependency'])

  expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
    'mocked-context',
    'dependency'
  ])
})

test('command with callbacks: success', async () => {
  const command = basicCommand()

  const callbacks = {
    request: jest.fn(),
    success: jest.fn(),
    failure: jest.fn()
  }
  await new Promise(resolve => {
    callbacks.success.mockImplementation(resolve)
    useCommand(command, callbacks)()
  })

  expect(mockedClient.command).toHaveBeenCalledWith(command, undefined)
  expect(callbacks.request).toHaveBeenCalledWith(command)
  expect(callbacks.success).toHaveBeenCalledWith({ result: 'command-result' })
  expect(callbacks.failure).not.toHaveBeenCalled()
})

test('command with callbacks: failure', async () => {
  const command = basicCommand()

  const callbacks = {
    request: jest.fn(),
    success: jest.fn(),
    failure: jest.fn()
  }

  mockedClient.command.mockRejectedValueOnce('command-error')

  await new Promise(resolve => {
    callbacks.failure.mockImplementation(resolve)
    useCommand(command, callbacks)()
  })

  expect(mockedClient.command).toHaveBeenCalledWith(command, undefined)
  expect(callbacks.request).toHaveBeenCalledWith(command)
  expect(callbacks.success).not.toHaveBeenCalled()
  expect(callbacks.failure).toHaveBeenCalledWith('command-error')
})

test('command with callbacks: only request', async () => {
  const command = basicCommand()

  const callbacks = {
    request: jest.fn()
  }

  await new Promise(resolve => {
    callbacks.request.mockImplementation(resolve)
    useCommand(command, callbacks)()
  })
})

test('command with callbacks: only success', async () => {
  const command = basicCommand()

  const callbacks = {
    success: jest.fn()
  }

  await new Promise(resolve => {
    callbacks.success.mockImplementation(resolve)
    useCommand(command, callbacks)()
  })
})

test('command with callbacks: only failure', async () => {
  const command = basicCommand()

  const callbacks = {
    failure: jest.fn()
  }

  mockedClient.command.mockRejectedValueOnce('command-error')

  await new Promise(resolve => {
    callbacks.failure.mockImplementation(resolve)
    useCommand(command, callbacks)()
  })
})

test('pass command options to the client', async () => {
  const command = basicCommand()

  useCommand(command, { customOption: 'option' })()

  expect(mockedClient.command).toHaveBeenCalledWith(command, {
    customOption: 'option'
  })
})

test('command, options, callbacks and dependencies all together', async () => {
  const command = basicCommand()
  const callbacks = {
    success: jest.fn()
  }

  await new Promise(resolve => {
    callbacks.success.mockImplementation(resolve)
    useCommand(command, { customOption: 'option' }, callbacks, ['dependency'])()
  })

  expect(mockedClient.command).toHaveBeenCalledWith(command, {
    customOption: 'option'
  })
  expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
    'mocked-context',
    'dependency'
  ])
})
