import { useContext, useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Command, CommandCallback, getClient } from 'resolve-client'
import { useCommand } from '../src/use_command'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => 'mocked-context'),
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedGetClient = mocked(getClient)
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

const clearMocks = (): void => {
  mockedGetClient.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()

  mockedClient.command.mockClear()
}

beforeAll(() => {
  mockedGetClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('client requested for specified context', () => {
    useCommand(basicCommand())

    expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
    expect(getClient).toHaveBeenCalledWith('mocked-context')
  })

  test('fail if not context found', () => {
    mockedUseContext.mockReturnValueOnce(null)

    expect(() => useCommand(basicCommand())).toThrow()
    expect(mockedGetClient).not.toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a command', async () => {
    const command = basicCommand()

    await useCommand(command)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      command
    ])
  })

  test('command and dependencies', async () => {
    const command = basicCommand()

    await useCommand(command, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      'dependency'
    ])
  })

  test('command and options', async () => {
    const command = basicCommand()
    const options = { option: 'option' }

    await useCommand(command, options)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      options,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      command,
      options
    ])
  })

  test('command, options and dependencies', async () => {
    const command = basicCommand()

    await useCommand(command, { option: 'option' }, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      { option: 'option' },
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      'dependency'
    ])
  })
})

describe('callback mode', () => {
  let callback: CommandCallback

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a command', () => {
    const command = basicCommand()

    useCommand(command, callback)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      command,
      callback
    ])
  })

  test('command, callback and dependencies', () => {
    const command = basicCommand()

    useCommand(command, callback, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      'dependency'
    ])
  })

  test('command, options and callback', () => {
    const command = basicCommand()
    const options = { option: 'option' }

    useCommand(command, options, callback)()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      command,
      options,
      callback
    ])
  })

  test('command, options, callback and dependencies', () => {
    const command = basicCommand()

    useCommand(command, { option: 'option' }, callback, ['dependency'])()

    expect(mockedClient.command).toHaveBeenCalledWith(
      command,
      { option: 'option' },
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      'dependency'
    ])
  })
})
